// Limpia rutas de foto rotas en lost_pets / found_pets / rescued_pets.
//
// Para cada mascota con fotos, hace una petición HEAD a la URL pública de cada
// foto. Si el servidor responde con un error definitivo (>= 400), la ruta se
// considera muerta (el archivo nunca se subió o ya no existe) y se elimina del
// arreglo `photos`. Los errores de red/timeout NO eliminan nada (se reportan).
//
// Uso:
//   node scripts/clean-dead-photos.mjs            # dry-run (solo reporta)
//   node scripts/clean-dead-photos.mjs --apply    # aplica los cambios en la BD
//
// Requiere en .env.local: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const BUCKET = "pet-photos";
const CONCURRENCY = 24;
const TABLES = ["lost_pets", "found_pets", "rescued_pets"];

// --- Cargar variables de entorno desde .env.local (sin dependencias) ---
function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(m[1] in env)) env[m[1]] = val;
    }
  } catch {
    /* sin .env.local: se usan las del entorno */
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function publicUrl(path) {
  if (/^https?:\/\//.test(path) || path.startsWith("data:")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

// Devuelve "ok" | "dead" | "unknown" (error de red → no se elimina)
async function checkPhoto(path) {
  if (path.startsWith("data:")) return "ok";
  const url = publicUrl(path);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      if (res.status >= 200 && res.status < 400) return "ok";
      if (res.status >= 400 && res.status < 600) return "dead";
      return "unknown";
    } catch {
      if (attempt === 1) return "unknown";
    }
  }
  return "unknown";
}

// Procesa una lista con límite de concurrencia
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

async function processTable(table) {
  // Paginar: Supabase limita cada select a 1000 filas por defecto.
  const PAGE = 1000;
  const fetched = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select("id, photos")
      .not("photos", "eq", "{}")
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      console.error(`  Error al leer ${table}: ${error.message}`);
      return { table, rows: 0, deadPhotos: 0, rowsUpdated: 0, unknown: 0 };
    }
    fetched.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }

  const rows = fetched.filter((r) => (r.photos?.length ?? 0) > 0);
  // Aplanar todas las fotos para chequear con concurrencia global por tabla
  const allChecks = [];
  for (const row of rows) {
    for (const path of row.photos) {
      allChecks.push({ rowId: row.id, path });
    }
  }

  const statuses = await mapLimit(allChecks, CONCURRENCY, (c) =>
    checkPhoto(c.path),
  );

  // Mapa de fotos muertas por fila
  const deadByRow = new Map();
  let deadPhotos = 0;
  let unknown = 0;
  allChecks.forEach((c, idx) => {
    if (statuses[idx] === "dead") {
      deadPhotos++;
      if (!deadByRow.has(c.rowId)) deadByRow.set(c.rowId, new Set());
      deadByRow.get(c.rowId).add(c.path);
    } else if (statuses[idx] === "unknown") {
      unknown++;
    }
  });

  let rowsUpdated = 0;
  for (const row of rows) {
    const dead = deadByRow.get(row.id);
    if (!dead || dead.size === 0) continue;
    const cleaned = row.photos.filter((p) => !dead.has(p));
    rowsUpdated++;
    console.log(
      `  ${table}/${row.id}: ${row.photos.length} → ${cleaned.length} fotos ` +
        `(${dead.size} rota${dead.size === 1 ? "" : "s"})`,
    );
    if (APPLY) {
      const { error: upErr } = await supabase
        .from(table)
        .update({ photos: cleaned })
        .eq("id", row.id);
      if (upErr) {
        console.error(`    ✗ No se pudo actualizar: ${upErr.message}`);
        rowsUpdated--;
      }
    }
  }

  return { table, rows: rows.length, deadPhotos, rowsUpdated, unknown };
}

async function main() {
  console.log(
    APPLY
      ? "MODO APLICAR: se modificará la base de datos.\n"
      : "MODO DRY-RUN: solo se reporta, no se modifica nada. Usa --apply para aplicar.\n",
  );

  const summary = [];
  for (const table of TABLES) {
    console.log(`Revisando ${table}…`);
    summary.push(await processTable(table));
  }

  console.log("\n=== Resumen ===");
  let totalDead = 0;
  let totalRows = 0;
  let totalUnknown = 0;
  for (const s of summary) {
    console.log(
      `${s.table}: ${s.rows} con fotos · ${s.deadPhotos} fotos rotas · ` +
        `${s.rowsUpdated} filas ${APPLY ? "actualizadas" : "a actualizar"}` +
        (s.unknown ? ` · ${s.unknown} sin verificar (error de red)` : ""),
    );
    totalDead += s.deadPhotos;
    totalRows += s.rowsUpdated;
    totalUnknown += s.unknown;
  }
  console.log(
    `\nTotal: ${totalDead} fotos rotas en ${totalRows} filas` +
      (totalUnknown ? ` · ${totalUnknown} sin verificar` : ""),
  );
  if (!APPLY && totalDead > 0) {
    console.log("\nPara aplicar: node scripts/clean-dead-photos.mjs --apply");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
