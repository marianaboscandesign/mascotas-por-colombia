import { nullIfEmpty } from "@/lib/validations/shared";
import { SHELTER_NEED_VALUES } from "@/lib/constants/shelters";
import { type shelterSchema } from "@/lib/validations/shelter";
import { type ShelterNeedEnum } from "@/types/database";
import { type z } from "zod";

type ShelterData = z.infer<typeof shelterSchema>;

/**
 * Construye el payload de inserción/actualización de un refugio a partir de
 * los datos ya validados del formulario. No incluye `cover_url` (la portada
 * se eliminó del formulario): así no se sobrescribe en actualizaciones.
 */
export function buildShelterPayload(d: ShelterData) {
  const needs = (d.needs ?? []).filter((n): n is ShelterNeedEnum =>
    (SHELTER_NEED_VALUES as string[]).includes(n),
  );
  const social: Record<string, string> = {};
  if (d.instagram?.trim()) social.instagram = d.instagram.trim();
  if (d.facebook?.trim()) social.facebook = d.facebook.trim();

  return {
    name: d.name.trim(),
    description: nullIfEmpty(d.description),
    email: nullIfEmpty(d.email),
    phone: nullIfEmpty(d.phone),
    whatsapp: nullIfEmpty(d.whatsapp),
    website: nullIfEmpty(d.website),
    country: d.country.trim(),
    city: d.city.trim(),
    region: nullIfEmpty(d.region),
    address: nullIfEmpty(d.address),
    manager_name: nullIfEmpty(d.managerName),
    schedule: nullIfEmpty(d.schedule),
    social,
    needs,
    kind: d.kind,
    status: d.status,
    logo_url: nullIfEmpty(d.logoUrl),
  };
}
