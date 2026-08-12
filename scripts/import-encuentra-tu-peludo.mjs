/**
 * Importa reportes públicos de Encuentra tu Peludo.
 *
 * Los avisos con una posible coincidencia se dejan en la bandeja de revisión.
 * Los que no la tienen se publican como reportes importados. Es idempotente:
 * una huella de origen evita procesar dos veces el mismo aviso.
 *
 * Uso:
 *   node scripts/import-encuentra-tu-peludo.mjs          # simulación
 *   node scripts/import-encuentra-tu-peludo.mjs --apply  # escribe en Supabase
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const SOURCE = "encuentra-tu-peludo";
const SOURCE_URL = "https://encuentratupeludo.vercel.app/";
const APPLY = process.argv.includes("--apply");
const LIMIT_AT = process.argv.indexOf("--limit");
const LIMIT = LIMIT_AT < 0 ? Infinity : Number.parseInt(process.argv[LIMIT_AT + 1] ?? "", 10);

const __dirname = dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync(join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || m[1] in env) continue;
      let value = m[2].trim();
      if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) value = value.slice(1, -1);
      env[m[1]] = value;
    }
  } catch { /* se usan variables del sistema */ }
  return env;
}

const env = loadEnv();
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.");
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const CITY_TO_STATE = new Map([
  ["armenia", "Quindío"], ["bogota", "Bogotá D.C."], ["bucaramanga", "Santander"],
  ["cali", "Valle del Cauca"], ["cartagena", "Bolívar"], ["cucuta", "Norte de Santander"],
  ["ibague", "Tolima"], ["manizales", "Caldas"], ["medellin", "Antioquia"],
  ["pasto", "Nariño"], ["pereira", "Risaralda"], ["popayan", "Cauca"],
  ["santa marta", "Magdalena"], ["valledupar", "Cesar"],
]);

const normalize = (value = "") => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const decode = (value) => value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&aacute;/g, "á").replace(/&eacute;/g, "é").replace(/&iacute;/g, "í").replace(/&oacute;/g, "ó").replace(/&uacute;/g, "ú").replace(/&ntilde;/g, "ñ").replace(/\s+/g, " ").trim();
const attr = (html, key) => html.match(new RegExp(`${key}="([^"]+)"`, "i"))?.[1] ?? null;
const paragraphTexts = (html) => [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => decode(m[1]));
const phoneFromUrl = (url) => url?.match(/wa\.me\/([^?/#]+)/i)?.[1].replace(/\D/g, "") ?? null;
const words = (value) => new Set(normalize(value).split(" ").filter((word) => word.length >= 4));

/** Convierte la URL del optimizador Next de la fuente en la foto original. */
function sourcePhotoUrl(raw) {
  if (!raw) return null;
  const resolved = new URL(decode(raw), SOURCE_URL);
  const original = resolved.searchParams.get("url");
  return original && /^https?:\/\//.test(original) ? original : resolved.href;
}

function inferName(description) {
  const match = description.match(/(?:se llama|su nombre es|responde al nombre(?: de)?)\s+([a-záéíóúñ0-9]{2,30})/i);
  return match?.[1] ? match[1][0].toUpperCase() + match[1].slice(1).toLowerCase() : null;
}

function parseReports(html) {
  const articles = [...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)];
  const seen = new Set();
  return articles.map((m) => {
    const article = m[1];
    const rawImage = attr(article, "src") ?? attr(article, "data-nimg");
    const image = sourcePhotoUrl(rawImage);
    const whatsapp = article.match(/href="(https:\/\/wa\.me\/[^"]+)"/i)?.[1]?.replace(/&amp;/g, "&") ?? null;
    const paragraphs = paragraphTexts(article);
    const plain = decode(article);
    const species = /\bgato\b/i.test(plain) ? "gato" : /\bperro\b/i.test(plain) ? "perro" : null;
    const reportKind = /\b(?:visto|encontrado)\b/i.test(plain) ? "encontrada" : "perdida";
    const city = paragraphs.find((p) => CITY_TO_STATE.has(normalize(p))) ?? null;
    const cityIndex = city ? paragraphs.indexOf(city) : -1;
    const sector = cityIndex > 0 ? paragraphs[cityIndex - 1] : null;
    const description = cityIndex >= 0 ? paragraphs[cityIndex + 1] ?? "" : paragraphs.at(-2) ?? "";
    const publishedLabel = paragraphs.at(-1) ?? null;
    if (!species || description.length < 5 || !whatsapp) return null;
    // La huella usa la URL publicada tal como viene en el HTML. Así se mantiene
    // compatible con los avisos que se importaron antes de normalizar la foto.
    const sourceKey = createHash("sha256").update([rawImage, species, city, description, phoneFromUrl(whatsapp)].join("|")).digest("hex");
    if (seen.has(sourceKey)) return null;
    seen.add(sourceKey);
    return { sourceKey, species, reportKind, city, sector, description, publishedLabel, image, whatsapp, name: inferName(description) };
  }).filter(Boolean);
}

function scoreCandidate(report, pet, kind) {
  const reasons = [];
  let score = 0;
  const incomingPhone = phoneFromUrl(report.whatsapp);
  const candidatePhone = kind === "perdida" ? pet.reporter_whatsapp ?? pet.reporter_phone : pet.finder_whatsapp ?? pet.finder_phone;
  if (incomingPhone && candidatePhone?.replace(/\D/g, "").endsWith(incomingPhone.slice(-10))) { score += 95; reasons.push("Mismo teléfono"); }
  if (report.image && pet.photos?.includes(report.image)) { score += 100; reasons.push("Misma foto de origen"); }
  if (report.name && pet.name && normalize(report.name) === normalize(pet.name)) { score += 45; reasons.push("Mismo nombre"); }
  if (report.city && pet.city && normalize(report.city) === normalize(pet.city)) { score += 18; reasons.push("Misma ciudad"); }
  const a = words(report.description); const b = words(pet.description ?? "");
  const shared = [...a].filter((word) => b.has(word)).length;
  if (shared) { score += Math.min(35, shared * 7); reasons.push(`${shared} rasgo${shared === 1 ? "" : "s"} textual${shared === 1 ? "" : "es"}`); }
  return { score: Math.min(100, score), reasons };
}

const petsBySpecies = new Map();

async function petsForSpecies(species) {
  const cached = petsBySpecies.get(species);
  if (cached) return cached;
  const baseFields = "id,name,description,city,photos";
  const [lost, found] = await Promise.all([
    supabase.from("lost_pets").select(`${baseFields},reporter_phone,reporter_whatsapp`).eq("species", species).is("deleted_at", null),
    supabase.from("found_pets").select(`${baseFields},finder_phone,finder_whatsapp`).eq("species", species).is("deleted_at", null),
  ]);
  if (lost.error) throw lost.error;
  if (found.error) throw found.error;
  const pets = [
    ...(lost.data ?? []).map((pet) => ({ pet, kind: "perdida" })),
    ...(found.data ?? []).map((pet) => ({ pet, kind: "encontrada" })),
  ];
  petsBySpecies.set(species, pets);
  return pets;
}

async function findCandidates(report) {
  const pets = await petsForSpecies(report.species);
  return pets.map(({ pet, kind }) => ({ ...scoreCandidate(report, pet, kind), pet, kind })).filter((candidate) => candidate.score >= 55).sort((a, b) => b.score - a.score).slice(0, 5);
}

async function publishNew(report, externalId) {
  const state = report.city ? CITY_TO_STATE.get(normalize(report.city)) : null;
  const phone = phoneFromUrl(report.whatsapp);
  if (!state || !phone) return false;
  const common = {
    name: report.name,
    species: report.species,
    description: report.description.slice(0, 4000),
    photos: report.image ? [report.image] : [],
    state,
    city: report.city,
    sector: report.sector,
    is_imported: true,
    is_approved: true,
  };
  const kind = report.reportKind;
  const payload = kind === "perdida"
    ? { ...common, status: "activa", reporter_name: "Contacto en Encuentra tu Peludo", reporter_phone: phone, reporter_whatsapp: phone }
    : { ...common, status: "en_la_calle", finder_name: "Contacto en Encuentra tu Peludo", finder_phone: phone, finder_whatsapp: phone };
  const table = kind === "perdida" ? "lost_pets" : "found_pets";
  const { data, error } = await supabase.from(table).insert(payload).select("id").single();
  if (error) throw error;
  const { error: updateError } = await supabase.from("external_pet_reports").update({ review_status: "publicada", published_pet_kind: kind, published_pet_id: data.id, reviewed_at: new Date().toISOString() }).eq("id", externalId);
  if (updateError) throw updateError;
  return true;
}

async function run() {
  const response = await fetch(SOURCE_URL, { headers: { "User-Agent": "MascotasPorColombia/1.0 (revisión de duplicados)" } });
  if (!response.ok) throw new Error(`La fuente respondió ${response.status}.`);
  const reports = parseReports(await response.text()).slice(0, Number.isFinite(LIMIT) ? LIMIT : undefined);
  console.log(`\n=== Importador Encuentra tu Peludo (${APPLY ? "APLICAR" : "SIMULACIÓN"}) ===`);
  console.log(`Reportes detectados: ${reports.length}`);
  let existing = 0, published = 0, pending = 0, needsData = 0;
  for (const report of reports) {
    const { data: already, error: existingError } = await supabase.from("external_pet_reports").select("id").eq("source_key", report.sourceKey).maybeSingle();
    if (existingError) throw existingError;
    if (already) { existing++; continue; }
    const candidates = await findCandidates(report);
    if (candidates.length) { pending++; if (!APPLY) continue; }
    const stateKnown = report.city && CITY_TO_STATE.has(normalize(report.city));
    if (!stateKnown) { needsData++; if (!APPLY) continue; }
    if (!APPLY) { if (!candidates.length) published++; continue; }
    const status = candidates.length ? "pendiente" : "requiere_datos";
    const { data: external, error } = await supabase.from("external_pet_reports").insert({ source: SOURCE, source_key: report.sourceKey, source_url: SOURCE_URL, report_kind: report.reportKind, species: report.species, name: report.name, description: report.description, city: report.city, sector: report.sector, source_photo_url: report.image, source_contact_url: report.whatsapp, source_published_label: report.publishedLabel, raw_payload: report, review_status: status }).select("id").single();
    if (error) throw error;
    if (candidates.length) {
      const { error: candidateError } = await supabase.from("external_pet_candidates").insert(candidates.map((c) => ({ external_report_id: external.id, pet_kind: c.kind, pet_id: c.pet.id, score: c.score, reasons: c.reasons })));
      if (candidateError) throw candidateError;
    } else if (await publishNew(report, external.id)) published++;
  }
  console.log({ existing, published, pending, needsData });
  if (!APPLY) console.log("Modo simulación: no se escribió en Supabase. Usa --apply para importar.");
}

run().catch((error) => { console.error(error); process.exit(1); });
