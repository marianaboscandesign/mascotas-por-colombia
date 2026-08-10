import { z } from "zod";

import { optionalText, speciesEnum, stateEnum } from "@/lib/validations/shared";

export const socialPetSchema = z.object({
  videoUrl: z
    .string()
    .trim()
    .url("URL no válida")
    .regex(
      /(tiktok\.com|instagram\.com)/i,
      "Debe ser un enlace de TikTok o Instagram",
    ),
  // Opcional: los videos pueden ser de refugios o causas, no solo de mascotas.
  species: z.union([z.literal(""), speciesEnum]).optional(),
  title: optionalText(120),
  state: z.union([z.literal(""), stateEnum]).optional(),
  city: optionalText(120),
  note: optionalText(500),
  isPublished: z.boolean().default(true),
  isResolved: z.boolean().default(false),
});

export type SocialPetValues = z.input<typeof socialPetSchema>;
