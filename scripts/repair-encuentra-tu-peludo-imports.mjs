/** Repara importaciones históricas: elimina la nota de fuente y normaliza fotos. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = "https://encuentratupeludo.vercel.app/";
const APPLY = process.argv.includes("--apply");

function loadEnv() {
  const env = { ...process.env };
  for (const line of readFileSync(join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || m[1] in env) continue;
    let value = m[2].trim();
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) value = value.slice(1, -1);
    env[m[1]] = value;
  }
  return env;
}
const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function photoUrl(value) {
  if (!value) return value;
  const resolved = new URL(value, SOURCE);
  const original = resolved.searchParams.get("url");
  return original && /^https?:\/\//.test(original) ? original : resolved.href;
}
function cleanDescription(value) {
  return value.replace(/\n\nFuente:\s*https:\/\/encuentratupeludo\.vercel\.app\/?\s*$/i, "").trim();
}

async function repairPets(table) {
  const { data, error } = await supabase.from(table).select("id,description,photos").eq("is_imported", true).is("deleted_at", null);
  if (error) throw error;
  let repaired = 0;
  for (const pet of data ?? []) {
    const description = cleanDescription(pet.description ?? "");
    const photos = (pet.photos ?? []).map(photoUrl);
    if (description === pet.description && JSON.stringify(photos) === JSON.stringify(pet.photos ?? [])) continue;
    repaired++;
    if (APPLY) {
      const { error: updateError } = await supabase.from(table).update({ description, photos }).eq("id", pet.id);
      if (updateError) throw updateError;
    }
  }
  return repaired;
}

async function repairExternalReports() {
  const { data, error } = await supabase.from("external_pet_reports").select("id,source_photo_url").eq("source", "encuentra-tu-peludo");
  if (error) throw error;
  let repaired = 0;
  for (const report of data ?? []) {
    const source_photo_url = photoUrl(report.source_photo_url);
    if (source_photo_url === report.source_photo_url) continue;
    repaired++;
    if (APPLY) {
      const { error: updateError } = await supabase.from("external_pet_reports").update({ source_photo_url }).eq("id", report.id);
      if (updateError) throw updateError;
    }
  }
  return repaired;
}

const [lost, found, external] = await Promise.all([repairPets("lost_pets"), repairPets("found_pets"), repairExternalReports()]);
console.log({ mode: APPLY ? "APLICAR" : "SIMULACIÓN", lost, found, external });
