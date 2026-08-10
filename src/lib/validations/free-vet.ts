import { z } from "zod";

import {
  optionalPhone,
  optionalText,
  stateEnum,
} from "@/lib/validations/shared";

const optionalFutureDate = z
  .union([
    z.literal(""),
    z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Fecha no válida"),
  ])
  .optional();

export const freeVetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Indica el nombre del servicio")
    .max(160, "Máximo 160 caracteres"),
  description: optionalText(2000),
  city: z
    .string()
    .trim()
    .min(2, "Indica la ciudad")
    .max(120, "Máximo 120 caracteres"),
  state: z.union([z.literal(""), stateEnum]).optional(),
  region: optionalText(120),
  sedes: z.array(z.string()).default([]),
  phones: z.array(z.string()).default([]),
  whatsapp: optionalPhone("WhatsApp"),
  address: optionalText(200),
  schedule: optionalText(280),
  source: optionalText(200),
  validUntil: optionalFutureDate,
  isPublished: z.boolean().default(true),
});

export type FreeVetValues = z.input<typeof freeVetSchema>;
