import {
  type FoundPetStatusEnum,
  type LostPetStatusEnum,
  type PetSexEnum,
  type PetSizeEnum,
  type PetSpeciesEnum,
} from "@/types/database";

interface Option<T extends string> {
  value: T;
  label: string;
}

export const SPECIES_OPTIONS: Option<PetSpeciesEnum>[] = [
  { value: "perro", label: "Perro" },
  { value: "gato", label: "Gato" },
  { value: "ave", label: "Ave" },
  { value: "otro", label: "Otro" },
];

export const SEX_OPTIONS: Option<PetSexEnum>[] = [
  { value: "macho", label: "Macho" },
  { value: "hembra", label: "Hembra" },
  { value: "desconocido", label: "No lo sé" },
];

export const SIZE_OPTIONS: Option<PetSizeEnum>[] = [
  { value: "pequeno", label: "Pequeño" },
  { value: "mediano", label: "Mediano" },
  { value: "grande", label: "Grande" },
];

/** Estado de salud aparente (mascotas encontradas). */
export const HEALTH_STATUS_OPTIONS: Option<string>[] = [
  { value: "Aparenta estar sano", label: "Aparenta estar sano" },
  { value: "Levemente herido", label: "Levemente herido" },
  {
    value: "Necesita atención urgente",
    label: "Necesita atención urgente",
  },
  { value: "Desconocido", label: "No estoy seguro" },
];

/** Etiqueta legible para el estado de un reporte de mascota perdida. */
export const LOST_PET_STATUS_LABELS: Record<LostPetStatusEnum, string> = {
  activa: "Búsqueda activa",
  encontrada: "¡Encontrada!",
  cerrada: "Cerrada",
  reunida: "Reunida con su familia",
};

/** Etiqueta legible para el estado de un reporte de mascota encontrada. */
export const FOUND_PET_STATUS_LABELS: Record<FoundPetStatusEnum, string> = {
  en_resguardo: "En resguardo",
  en_la_calle: "Sola en la calle",
  reunida: "¡Reunida!",
  derivada: "Derivada a refugio",
  cerrada: "Cerrada",
};

/** Límites de subida de fotos. */
export const MAX_PHOTOS = 8;
export const MIN_PHOTOS = 1;
/** Máximo de fotos para reportes de mascotas encontradas. */
export const MAX_FOUND_PHOTOS = 5;
export const MAX_PHOTO_SIZE_MB = 10; // tamaño máximo del archivo original
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** Límites del video corto (mascotas encontradas). */
export const MAX_VIDEO_SECONDS = 30;
export const MAX_VIDEO_SIZE_MB = 50;
export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;
