import { z } from "zod";

/** Alta de una cuenta de moderador (solo super_admin). */
export const createModeratorSchema = z.object({
  fullName: z
    .string({ required_error: "El nombre es obligatorio" })
    .trim()
    .min(2, "El nombre es obligatorio")
    .max(120, "Máximo 120 caracteres"),
  email: z
    .string({ required_error: "El correo es obligatorio" })
    .trim()
    .email("Correo no válido")
    .max(160),
  password: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(8, "Mínimo 8 caracteres")
    .max(72, "Máximo 72 caracteres"),
});

export type CreateModeratorValues = z.input<typeof createModeratorSchema>;

/**
 * Edición de una cuenta de moderador (solo super_admin). Todos los campos son
 * opcionales: se actualiza solo lo que venga. La contraseña vacía significa
 * "no cambiarla" (no se puede leer la actual porque está cifrada).
 */
export const updateModeratorSchema = z.object({
  id: z.string().uuid("Moderador no válido"),
  fullName: z
    .string()
    .trim()
    .min(2, "El nombre es obligatorio")
    .max(120)
    .optional(),
  email: z.string().trim().email("Correo no válido").max(160).optional(),
  password: z
    .union([z.string().min(8, "Mínimo 8 caracteres").max(72), z.literal("")])
    .optional(),
});

export type UpdateModeratorValues = z.input<typeof updateModeratorSchema>;

/** Cambio de contraseña por el propio moderador (primer inicio o voluntario). */
export const changeOwnPasswordSchema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres").max(72, "Máximo 72"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });
