import { type VolunteerStatusEnum } from "@/types/database";

/** Roles en los que una persona puede ofrecerse como voluntaria. */
export const VOLUNTEER_ROLES: { value: string; label: string }[] = [
  { value: "veterinario", label: "Veterinario" },
  { value: "transportista", label: "Transportista" },
  { value: "casa_temporal", label: "Casa temporal" },
  { value: "rescatista", label: "Rescatista" },
  { value: "paseador", label: "Paseador" },
  { value: "donante", label: "Donante" },
  { value: "peluquero_canino", label: "Peluquero canino" },
  { value: "estudiante_veterinaria", label: "Estudiante de veterinaria" },
  { value: "otro", label: "Otro" },
];

export const VOLUNTEER_ROLE_VALUES: string[] = VOLUNTEER_ROLES.map(
  (r) => r.value,
);

export const VOLUNTEER_ROLE_LABELS: Record<string, string> = Object.fromEntries(
  VOLUNTEER_ROLES.map((r) => [r.value, r.label]),
);

export const VOLUNTEER_STATUS_LABELS: Record<VolunteerStatusEnum, string> = {
  pendiente: "Pendiente",
  activo: "Activo",
  inactivo: "Inactivo",
};
