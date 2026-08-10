import { z } from "zod";

import { optionalPhone, optionalText } from "@/lib/validations/shared";

const optionalUrl = z
  .union([z.literal(""), z.string().trim().url("URL no válida")])
  .optional();

const optionalEmail = z
  .union([
    z.literal(""),
    z.string().trim().email("Correo electrónico no válido"),
  ])
  .optional();

export const shelterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Indica el nombre del refugio")
    .max(160, "Máximo 160 caracteres"),
  country: z
    .string()
    .trim()
    .min(2, "Indica el país")
    .max(80, "Máximo 80 caracteres"),
  city: z
    .string()
    .trim()
    .min(2, "Indica la ciudad")
    .max(120, "Máximo 120 caracteres"),
  region: optionalText(120),
  address: optionalText(200),
  description: optionalText(4000),
  managerName: optionalText(120),
  schedule: optionalText(280),
  email: optionalEmail,
  phone: optionalPhone("Teléfono"),
  whatsapp: optionalPhone("WhatsApp"),
  website: optionalUrl,
  instagram: optionalUrl,
  facebook: optionalUrl,
  needs: z.array(z.string()).default([]),
  kind: z.enum(["refugio", "centro_acopio", "ambos"]).default("refugio"),
  status: z
    .enum(["pendiente", "verificado", "suspendido"])
    .default("verificado"),
  logoUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

export type ShelterFormValues = z.input<typeof shelterSchema>;
