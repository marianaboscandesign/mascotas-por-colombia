import { z } from "zod";

export const newsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "El título es muy corto")
    .max(200, "Máximo 200 caracteres"),
  excerpt: z
    .string()
    .trim()
    .max(320, "Máximo 320 caracteres")
    .optional()
    .or(z.literal("")),
  content: z.string().trim().min(1, "Escribe el contenido"),
  // Ruta en Storage o URL externa (el cliente controla el valor).
  cover: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.enum([
    "rescates",
    "adopciones",
    "campanas",
    "consejos",
    "eventos",
    "comunidad",
  ]),
  isFeatured: z.boolean().default(false),
  publishedDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Fecha no válida"),
  tags: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["borrador", "publicado", "archivado"]).default("borrador"),
});

export type NewsFormValues = z.input<typeof newsSchema>;
