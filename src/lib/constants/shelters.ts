import { type ShelterKindEnum, type ShelterNeedEnum } from "@/types/database";

/** Tipos de organización (coincide con el enum `shelter_kind`). */
export const SHELTER_KINDS: {
  value: ShelterKindEnum;
  label: string;
  description: string;
}[] = [
  {
    value: "refugio",
    label: "Refugio",
    description: "Alberga y cuida animales",
  },
  {
    value: "centro_acopio",
    label: "Centro de acopio",
    description: "Recibe donaciones",
  },
  {
    value: "ambos",
    label: "Ambos",
    description: "Refugio y centro de acopio",
  },
];

/** Etiqueta corta para mostrar el tipo en tarjetas y fichas. */
export const SHELTER_KIND_LABELS: Record<ShelterKindEnum, string> = {
  refugio: "Refugio",
  centro_acopio: "Centro de acopio",
  ambos: "Refugio y acopio",
};

/** Catálogo de necesidades de un refugio (coincide con el enum `shelter_need`). */
export const SHELTER_NEEDS: { value: ShelterNeedEnum; label: string }[] = [
  { value: "alimento", label: "Alimento" },
  { value: "perrarina", label: "Perrarina" },
  { value: "gatarina", label: "Gatarina" },
  { value: "agua", label: "Agua" },
  { value: "medicinas", label: "Medicinas" },
  { value: "guantes", label: "Guantes" },
  { value: "gasas", label: "Gasas" },
  { value: "vendas", label: "Vendas" },
  { value: "mantas", label: "Mantas" },
  { value: "correas", label: "Correas" },
  { value: "kennels", label: "Kennels" },
  { value: "casas_temporales", label: "Casas temporales" },
  { value: "camas", label: "Camas" },
  { value: "accesorios", label: "Accesorios" },
  { value: "arena_gatos", label: "Arena para gatos" },
  { value: "productos_limpieza", label: "Productos de limpieza" },
  { value: "transporte", label: "Transporte" },
  { value: "veterinarios", label: "Veterinarios" },
  { value: "donaciones", label: "Donaciones económicas" },
];

export const SHELTER_NEED_LABELS: Record<ShelterNeedEnum, string> =
  Object.fromEntries(SHELTER_NEEDS.map((n) => [n.value, n.label])) as Record<
    ShelterNeedEnum,
    string
  >;

export const SHELTER_NEED_VALUES: ShelterNeedEnum[] = SHELTER_NEEDS.map(
  (n) => n.value,
);

/**
 * Construye la etiqueta de ubicación del centro de acopio.
 * Funciona para cualquier país: usa ciudad + (región/estado) + país.
 */
export function shelterLocationLabel(shelter: {
  city: string;
  region?: string | null;
  state?: string | null;
  country?: string | null;
}): string {
  const parts = [
    shelter.city,
    shelter.region ?? shelter.state ?? null,
    shelter.country ?? null,
  ].filter((p): p is string => Boolean(p && p.trim()));
  return parts.join(", ");
}

/** Plataformas sociales que se muestran en la ficha del refugio. */
export const SHELTER_SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X" },
  { key: "tiktok", label: "TikTok" },
] as const;

export type ShelterSocialKey = (typeof SHELTER_SOCIAL_PLATFORMS)[number]["key"];
