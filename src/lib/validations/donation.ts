import { z } from "zod";

import { optionalText } from "@/lib/validations/shared";

/** Organización de donaciones (gestión admin). */
export const donationOrgSchema = z.object({
  name: z
    .string({ required_error: "El nombre es obligatorio" })
    .trim()
    .min(2, "El nombre es obligatorio")
    .max(160, "Máximo 160 caracteres"),
  url: z
    .string({ required_error: "El enlace es obligatorio" })
    .trim()
    .url("Escribe un enlace válido (https://…)")
    .max(500),
  urlLabel: z
    .string({ required_error: "Escribe el texto del enlace" })
    .trim()
    .min(2, "Escribe el texto del enlace")
    .max(160, "Máximo 160 caracteres"),
  instagram: optionalText(80),
  description: z
    .string({ required_error: "La descripción es obligatoria" })
    .trim()
    .min(2, "La descripción es obligatoria")
    .max(600, "Máximo 600 caracteres"),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isPublished: z.boolean().default(true),
});

export type DonationOrgValues = z.input<typeof donationOrgSchema>;
