import { z } from "zod";

import {
  optionalPhone,
  optionalText,
  stateEnum,
} from "@/lib/validations/shared";

export const volunteerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Indica tu nombre")
    .max(120, "Máximo 120 caracteres"),
  state: stateEnum,
  city: z
    .string()
    .trim()
    .min(2, "Indica tu ciudad")
    .max(120, "Máximo 120 caracteres"),
  phone: optionalPhone("Teléfono"),
  whatsapp: optionalPhone("WhatsApp"),
  email: z
    .string()
    .trim()
    .min(1, "Indica tu correo")
    .email("Correo electrónico no válido"),
  profession: z
    .string()
    .trim()
    .min(2, "Indica tu profesión u ocupación")
    .max(120, "Máximo 120 caracteres"),
  availability: z
    .string()
    .trim()
    .min(2, "Indica tu disponibilidad")
    .max(280, "Máximo 280 caracteres"),
  comments: optionalText(2000),
  roles: z
    .array(z.string())
    .min(1, "Selecciona al menos un rol")
    .max(9, "Demasiados roles"),
  // Canales de contacto que el voluntario acepta mostrar públicamente.
  // Un voluntario activo aparece en el directorio solo si acepta mostrar
  // al menos uno (es su consentimiento para publicar su contacto).
  publicContact: z.array(z.enum(["email", "phone", "whatsapp"])).default([]),
});

export const volunteerSchemaWithConsent = volunteerSchema.superRefine(
  (data, ctx) => {
    if (data.publicContact.includes("phone") && !data.phone?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Indica tu teléfono para poder mostrarlo.",
      });
    }
    if (data.publicContact.includes("whatsapp") && !data.whatsapp?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["whatsapp"],
        message: "Indica tu WhatsApp para poder mostrarlo.",
      });
    }
  },
);

export type VolunteerFormValues = z.input<typeof volunteerSchema>;
