import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind de forma segura, resolviendo conflictos.
 * Uso: cn("px-2", condicion && "px-4") → "px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea una fecha ISO a un texto legible en español. */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-CO", options).format(value);
}

/** Recorta un texto a un número máximo de caracteres con elipsis. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/**
 * Normaliza un teléfono al formato que exige WhatsApp (wa.me): solo dígitos,
 * con código de país y sin el 0 troncal inicial.
 *
 * Reglas:
 *  - Con "+" o "00" (formato internacional) → se respeta su código de país.
 *  - Sin código → se asume Colombia (57): se quita el 0 inicial
 *    (0300… → 57300…). Si ya empieza por 57, se deja igual.
 *
 * Para números de otros países, escríbelos con "+" y su prefijo (ej. +1 305…).
 */
export function whatsappNumber(raw: string, defaultCountry = "57"): string {
  const trimmed = raw.trim();
  const isInternational = trimmed.startsWith("+") || trimmed.startsWith("00");
  let digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("00")) digits = digits.slice(2);
  if (isInternational) return digits; // ya incluye el código de país
  if (digits.startsWith("0")) digits = digits.slice(1); // quita el 0 troncal
  if (digits.startsWith(defaultCountry)) return digits;
  return defaultCountry + digits;
}

/** Construye un enlace wa.me a partir de un teléfono en cualquier formato. */
export function whatsappLink(raw: string, text?: string): string {
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${whatsappNumber(raw)}${query}`;
}

/** Convierte un texto en un slug seguro para URLs. */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // elimina acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Genera la URL amigable para una mascota perdida. */
export function getLostPetUrl(pet: { id: string; name?: string | null; species: string; city?: string | null; state?: string | null; rank?: number }): string {
  const nameSlug = slugify(pet.name || (pet.species === "perro" ? "perro" : pet.species === "gato" ? "gato" : pet.species === "ave" ? "ave" : "mascota"));
  const citySlug = pet.city ? slugify(pet.city) : pet.state ? slugify(pet.state) : "";
  const slugParts = [nameSlug, citySlug].filter(Boolean);
  const base = slugParts.join("-");
  const rankSuffix = pet.rank && pet.rank > 1 ? `-${pet.rank}` : "";
  return `/mascotas/${base}${rankSuffix}`;
}

/** Genera la URL amigable para una mascota encontrada. */
export function getFoundPetUrl(pet: { id: string; name?: string | null; species: string; city?: string | null; state?: string | null; rank?: number }): string {
  const nameSlug = slugify(pet.name || (pet.species === "perro" ? "perro" : pet.species === "gato" ? "gato" : pet.species === "ave" ? "ave" : "mascota"));
  const citySlug = pet.city ? slugify(pet.city) : pet.state ? slugify(pet.state) : "";
  const slugParts = [nameSlug, citySlug].filter(Boolean);
  const base = slugParts.join("-");
  const rankSuffix = pet.rank && pet.rank > 1 ? `-${pet.rank}` : "";
  return `/found-pets/${base}${rankSuffix}`;
}

/** Genera la URL amigable para una historia de éxito. */
export function getSuccessStoryUrl(story: { id: string; title?: string | null; species: string; city?: string | null; state?: string | null; rank?: number }): string {
  const nameSlug = slugify(story.title || (story.species === "perro" ? "perro" : story.species === "gato" ? "gato" : story.species === "ave" ? "ave" : "mascota"));
  const citySlug = story.city ? slugify(story.city) : story.state ? slugify(story.state) : "";
  const slugParts = [nameSlug, citySlug].filter(Boolean);
  const base = slugParts.join("-");
  const rankSuffix = story.rank && story.rank > 1 ? `-${story.rank}` : "";
  return `/success-stories/${base}${rankSuffix}`;
}
