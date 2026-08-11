// Backfill: genera la FICHA VISUAL (Gemini) de las mascotas que aún no la
// tienen (visual_profile IS NULL). Idempotente y resumible: si se corta (o se
// alcanza el límite gratuito de Gemini), vuelve a correrlo y sigue donde quedó.
//
// Uso:
//   node scripts/generate-visual-profiles.mjs                 # dry-run (cuenta + costo estimado)
//   node scripts/generate-visual-profiles.mjs --apply         # genera y guarda
//   node scripts/generate-visual-profiles.mjs --apply --limit 200   # solo N (para respetar cuotas)
//
// Requiere en .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY.
//
// NOTA: el esquema/prompt/versión deben ir en sincronía con
// src/lib/ai/visual-profile-schema.ts (VISUAL_PROFILE_VERSION).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI, Type } from "@google/genai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const limitArg = process.argv.indexOf("--limit");
const MAX = limitArg > -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

const MODEL = "gemini-2.5-flash";
const VERSION = 1; // = VISUAL_PROFILE_VERSION
const CONCURRENCY = 2; // conservador para el nivel gratuito
const MAX_RATE_LIMIT_STREAK = 8; // si se encadenan 429, detener y avisar

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
      )
        val = val.slice(1, -1);
      if (!(m[1] in env)) env[m[1]] = val;
    }
  } catch {
    /* usa el entorno */
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_CLOUD_PROJECT = env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = env.GOOGLE_CLOUD_LOCATION;
// Los scripts de Node no cargan .env.local automáticamente. Google Auth sí
// lee esta variable desde process.env para obtener las credenciales de Vertex.
let googleAuthOptions;
if (env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  try {
    const credentials = JSON.parse(env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    if (
      credentials.type !== "service_account" ||
      !credentials.client_email ||
      !credentials.private_key
    ) {
      throw new Error("formato de cuenta de servicio no válido");
    }
    googleAuthOptions = { credentials };
  } catch (error) {
    console.error(
      "GOOGLE_APPLICATION_CREDENTIALS_JSON no es válido:",
      error instanceof Error ? error.message : "JSON inválido",
    );
    process.exit(1);
  }
}
if (!SUPABASE_URL || !SERVICE_KEY || !GOOGLE_CLOUD_PROJECT || !GOOGLE_CLOUD_LOCATION) {
  console.error(
    "Faltan credenciales de Supabase o la configuración de Vertex AI en .env.local",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});
const ai = new GoogleGenAI({
  vertexai: true,
  project: GOOGLE_CLOUD_PROJECT,
  location: GOOGLE_CLOUD_LOCATION,
  googleAuthOptions,
});

// ── Esquema y prompt (en sincronía con visual-profile-schema.ts) ──
const COLOR = [
  "negro", "blanco", "marron", "dorado", "gris", "crema", "naranja",
  "atigrado", "tricolor", "manchado",
];
const en = (v) => ({ type: Type.STRING, enum: v, nullable: true });
const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    species: en(["perro", "gato", "ave", "otro"]),
    breed_estimated: { type: Type.STRING, nullable: true },
    size: en(["pequeno", "mediano", "grande"]),
    primary_color: en(COLOR),
    secondary_color: en(COLOR),
    coat_pattern: en(["solido", "bicolor", "tricolor", "atigrado", "manchado", "rayado"]),
    ear_type: en(["paradas", "caidas", "semicaidas", "recortadas", "puntiagudas"]),
    tail_type: en(["larga", "corta", "enroscada", "esponjada", "sin_cola"]),
    nose_color: en(["negra", "rosada", "marron", "moteada"]),
    eye_color: en(["marron", "ambar", "azul", "verde", "heterocromia"]),
    collar: {
      type: Type.OBJECT,
      properties: {
        present: { type: Type.BOOLEAN },
        color: { type: Type.STRING, nullable: true },
      },
      required: ["present"],
    },
    accessories: {
      type: Type.ARRAY,
      items: { type: Type.STRING, enum: ["bandana", "placa", "correa", "sueter", "ninguno"] },
    },
    age_estimate: en(["cachorro", "joven", "adulto", "senior"]),
    unique_features: { type: Type.ARRAY, items: { type: Type.STRING } },
    physical_condition: en(["saludable", "delgada", "herida", "descuidada"]),
    confidence: { type: Type.NUMBER },
  },
  required: ["species", "confidence"],
};
const PROMPT = `Eres un asistente veterinario experto en identificación de mascotas. Analiza ÚNICAMENTE al animal principal de la fotografía y completa su ficha visual.

Reglas:
- Usa solo los valores permitidos de cada campo. Si un rasgo NO es claramente visible, devuelve null (no adivines).
- Sé objetivo y consistente: describe lo que se ve, no lo que supones.
- "unique_features": máximo 4 rasgos realmente distintivos y en español breve.
- "confidence": qué tan clara y completa es la foto para este análisis (0 a 1).
Devuelve solo el JSON con el esquema indicado.`;

const photoUrl = (p) =>
  /^https?:\/\//.test(p)
    ? p
    : `${SUPABASE_URL}/storage/v1/object/public/pet-photos/${p}`;

/** Lista pets sin ficha (con foto). Devuelve [{table, id, photo}]. */
async function listNeeding() {
  const out = [];
  for (const table of ["lost_pets", "found_pets"]) {
    let from = 0;
    const page = 1000;
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select("id, photos")
        .is("visual_profile", null)
        .is("deleted_at", null)
        .not("photos", "is", null)
        .order("created_at", { ascending: false })
        .range(from, from + page - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const r of data) {
        const p = r.photos?.[0];
        if (p) out.push({ table, id: r.id, photo: p });
      }
      if (data.length < page) break;
      from += page;
    }
  }
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Genera y guarda la ficha de una mascota. Devuelve 'ok'|'skip'|'rate'|'err'. */
async function processOne(item) {
  let res;
  try {
    res = await fetch(photoUrl(item.photo));
  } catch {
    return "err";
  }
  if (!res.ok) return "err";
  const mimeType = res.headers.get("content-type") ?? "image/webp";
  const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");

  let out;
  try {
    out = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: PROMPT }, { inlineData: { data: base64, mimeType } }],
        },
      ],
      config: { responseMimeType: "application/json", responseSchema: SCHEMA },
    });
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (msg.includes("429") || /rate|quota|RESOURCE_EXHAUSTED/i.test(msg))
      return "rate";
    return "err";
  }

  let profile;
  try {
    profile = JSON.parse(out.text);
  } catch {
    return "err";
  }

  const { error } = await supabase
    .from(item.table)
    .update({
      visual_profile: profile,
      visual_profile_at: new Date().toISOString(),
      visual_profile_version: VERSION,
    })
    .eq("id", item.id)
    .is("visual_profile", null);
  return error ? "err" : "ok";
}

async function run() {
  console.log(`\n=== Fichas visuales (${APPLY ? "APLICAR" : "DRY-RUN"}) ===\n`);
  const all = await listNeeding();
  console.log(`  Mascotas sin ficha (con foto): ${all.length}`);
  console.log(
    `  Costo estimado con ${MODEL}: ~US$${(all.length * 0.0004).toFixed(2)} (0 en nivel gratuito)`,
  );
  if (!APPLY) {
    console.log("\n  (dry-run) Corre con --apply para generarlas.\n");
    return;
  }

  const queue = all.slice(0, MAX === Infinity ? all.length : MAX);
  console.log(`  A procesar en esta corrida: ${queue.length}\n`);

  let ok = 0, err = 0, rate = 0, done = 0, streak = 0, stop = false;
  let idx = 0;
  async function worker() {
    while (idx < queue.length && !stop) {
      const item = queue[idx++];
      const r = await processOne(item);
      done++;
      if (r === "ok") { ok++; streak = 0; }
      else if (r === "rate") {
        rate++; streak++;
        await sleep(20000); // espera ante 429
        idx--; // reintentar este item
        if (streak >= MAX_RATE_LIMIT_STREAK) stop = true;
      } else { err++; streak = 0; }
      if (done % 25 === 0)
        console.log(`  progreso: ${done}/${queue.length} (ok ${ok}, err ${err})`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(
    `\n  ${stop ? "DETENIDO por límite de Gemini" : "Listo"}. ok=${ok}, errores=${err}, reintentos por límite=${rate}`,
  );
  if (stop || ok < queue.length - err)
    console.log("  Vuelve a correrlo más tarde para continuar (es resumible).\n");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
