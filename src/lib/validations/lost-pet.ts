import { z } from "zod";

import { MAX_PHOTOS, MIN_PHOTOS } from "@/lib/constants/pets";
import {
  optionalEmail,
  optionalPastDate,
  optionalPhone,
  optionalText,
  COLOMBIA_DEPARTMENT_VALUES,
} from "@/lib/validations/shared";

/** Campos del formulario de mascota perdida. */
export const lostPetFieldsSchema = z
  .object({
    name: optionalText(80),
    species: z.enum(["perro", "gato", "ave", "otro"], {
      required_error: "Selecciona la especie",
    }),
    breed: optionalText(120),
    sex: z.enum(["macho", "hembra", "desconocido"]).default("desconocido"),
    size: z.enum(["pequeno", "mediano", "grande"]).optional(),
    color: optionalText(80),
    description: optionalText(4000),
    state: z.enum(COLOMBIA_DEPARTMENT_VALUES, {
      required_error: "Selecciona el estado",
    }),
    city: optionalText(120),
    lastSeenLocation: optionalText(200),
    lastSeenDate: optionalPastDate,
    reporterName: z
      .string({ required_error: "Escribe el nombre del dueño" })
      .trim()
      .min(1, "Escribe el nombre del dueño")
      .max(120, "Máximo 120 caracteres"),
    reporterPhone: optionalPhone("Teléfono / WhatsApp"),
    reporterEmail: optionalEmail,
  })
  .refine((data) => Boolean(data.reporterPhone || data.reporterEmail), {
    message: "Deja al menos un medio de contacto (teléfono/WhatsApp o correo)",
    path: ["reporterPhone"],
  });

export type LostPetFormValues = z.input<typeof lostPetFieldsSchema>;

/** Esquema completo que valida el Server Action (campos + rutas de fotos). */
export const createLostPetSchema = z.intersection(
  lostPetFieldsSchema,
  z.object({
    photos: z
      .array(z.string().min(1))
      .min(MIN_PHOTOS, "Sube al menos una foto")
      .max(MAX_PHOTOS, `Máximo ${MAX_PHOTOS} fotos`),
  }),
);

export type CreateLostPetInput = z.infer<typeof createLostPetSchema>;
