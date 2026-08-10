// Genera miniaturas WebP (~400px) para las fotos EXISTENTES del bucket
// pet-photos, siguiendo la convención `lost/uuid.ext` → `lost/thumbs/uuid.webp`.
//
// Se ejecuta UNA sola vez (es idempotente: salta las que ya tienen miniatura).
// Las nuevas subidas ya generan su miniatura solas (ver lib/storage/pet-photos).
//
// Uso:
//   node scripts/generate-thumbnails.mjs           # dry-run (solo cuenta)
//   node scripts/generate-thumbnails.mjs --apply   # genera y sube las miniaturas
//
// Requiere en .env.local: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const BUCKET = "pet-photos";
const FOLDERS = ["lost", "found"];
const THUMB_MAX = 400;
const QUALITY = 70;
const CONCURRENCY = 8;

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

/** Lista TODOS los objetos bajo un prefijo (paginado). */
async function listAll(prefix) {
  const out = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }
  return out;
}

const isImage = (name) => /\.(webp|jpe?g|png)$/i.test(name);
const thumbName = (name) => name.replace(/\.[^.]+$/, "") + ".webp";

async function generateThumb(srcPath, destPath) {
  const { data: blob, error } = await supabase.storage
    .from(BUCKET)
    .download(srcPath);
  if (error || !blob)
    throw new Error(`download: ${error?.message ?? "sin datos"}`);

  const input = Buffer.from(await blob.arrayBuffer());
  const output = await sharp(input)
    .rotate() // respeta la orientación EXIF
    .resize({
      width: THUMB_MAX,
      height: THUMB_MAX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .toBuffer();

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(destPath, output, { contentType: "image/webp", upsert: true });
  if (upErr) throw new Error(`upload: ${upErr.message}`);

  return output.length;
}

async function run() {
  console.log(
    `\n=== Miniaturas pet-photos (${APPLY ? "APLICAR" : "DRY-RUN"}) ===\n`,
  );

  let pending = [];
  for (const folder of FOLDERS) {
    const files = (await listAll(`${folder}/`)).filter(
      (f) => f.id && isImage(f.name),
    );
    const existing = new Set(
      (await listAll(`${folder}/thumbs/`))
        .filter((f) => f.id)
        .map((f) => f.name),
    );
    const todo = files.filter((f) => !existing.has(thumbName(f.name)));
    console.log(
      `  ${folder}/: ${files.length} fotos, ${existing.size} ya con miniatura, ${todo.length} por generar`,
    );
    for (const f of todo) {
      pending.push({
        src: `${folder}/${f.name}`,
        dest: `${folder}/thumbs/${thumbName(f.name)}`,
      });
    }
  }

  console.log(`\n  TOTAL por generar: ${pending.length}\n`);
  if (!APPLY) {
    console.log("  (dry-run) Ejecuta con --apply para generarlas.\n");
    return;
  }

  let done = 0;
  let failed = 0;
  let bytes = 0;
  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const batch = pending.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((p) => generateThumb(p.src, p.dest)),
    );
    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r.status === "fulfilled") {
        done++;
        bytes += r.value;
      } else {
        failed++;
        console.warn(`  ⚠ ${batch[j].src}: ${r.reason?.message ?? r.reason}`);
      }
    }
    if ((i / CONCURRENCY) % 10 === 0 || i + CONCURRENCY >= pending.length) {
      console.log(`  progreso: ${done + failed}/${pending.length}`);
    }
  }

  console.log(
    `\n  Listo. Generadas: ${done}, fallidas: ${failed}, peso miniaturas: ${(bytes / 1048576).toFixed(1)} MB\n`,
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
