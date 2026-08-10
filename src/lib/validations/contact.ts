import { z } from "zod";

import {
  optionalEmail,
  optionalText,
  PHONE_RE,
} from "@/lib/validations/shared";

/** Formulario de contacto público. El teléfono/WhatsApp es obligatorio. */
export const contactSchema = z.object({
  name: z
    .string({ required_error: "Escribe tu nombre" })
    .trim()
    .min(1, "Escribe tu nombre")
    .max(120, "Máximo 120 caracteres"),
  phone: z
    .string({ required_error: "El teléfono o WhatsApp es obligatorio" })
    .trim()
    .min(1, "El teléfono o WhatsApp es obligatorio")
    .regex(PHONE_RE, "Escribe un teléfono válido")
    .max(20, "Teléfono demasiado largo"),
  email: optionalEmail,
  subject: optionalText(160),
  message: z
    .string({ required_error: "Escribe tu mensaje" })
    .trim()
    .min(1, "Escribe tu mensaje")
    .max(2000, "Máximo 2000 caracteres"),
});

export type ContactFormValues = z.input<typeof contactSchema>;
