import { z } from "zod";

import { MAX_FOUND_PHOTOS } from "@/lib/constants/pets";
import {
  optionalEmail,
  optionalPastDate,
  optionalPhone,
  optionalText,
  sexEnum,
  sizeEnum,
  speciesEnum,
  stateEnum,
} from "@/lib/validations/shared";

/** Campos del formulario de mascota encontrada. */
export const foundPetFieldsSchema = z
  .object({
    species: speciesEnum,
    // Cómo se encuentra la mascota al reportarla.
    status: z.enum(["en_resguardo", "en_la_calle"]).default("en_resguardo"),
    breed: optionalText(120),
    sex: sexEnum.default("desconocido"),
    color: optionalText(80),
    size: sizeEnum.default("mediano"),
    foundDate: optionalPastDate,
    state: stateEnum,
    city: optionalText(120),
    address: optionalText(200),
    healthStatus: optionalText(280),
    description: optionalText(4000),
    contactName: z
      .string({ required_error: "Escribe tu nombre" })
      .trim()
      .min(1, "Escribe tu nombre")
      .max(120, "Máximo 120 caracteres"),
    contactPhone: optionalPhone("Teléfono / WhatsApp"),
    contactEmail: optionalEmail,
  })
  .refine((d) => Boolean(d.contactPhone || d.contactEmail), {
    message: "Deja al menos un medio de contacto (teléfono/WhatsApp o correo)",
    path: ["contactPhone"],
  });

export type FoundPetFormValues = z.input<typeof foundPetFieldsSchema>;

/** Esquema que valida el Server Action (campos + medios subidos). */
export const createFoundPetSchema = z.intersection(
  foundPetFieldsSchema,
  z.object({
    photos: z
      .array(z.string().min(1))
      .min(1, "Sube al menos una foto")
      .max(MAX_FOUND_PHOTOS, `Máximo ${MAX_FOUND_PHOTOS} fotos`),
    videoPath: z.string().min(1).optional(),
    latitude: z.number().min(-90).max(90).nullish(),
    longitude: z.number().min(-180).max(180).nullish(),
  }),
);

export type CreateFoundPetInput = z.infer<typeof createFoundPetSchema>;
