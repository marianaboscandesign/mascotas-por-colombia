import { z } from "zod";

/** Coincide con la validación de la BD: dígitos, espacios y + ( ) - (7–20). */
export const PHONE_RE = /^[0-9+()\s-]{7,20}$/;

export const COLOMBIA_DEPARTMENT_VALUES = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bogotá D.C.",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
] as const;

export const stateEnum = z.enum(COLOMBIA_DEPARTMENT_VALUES, {
  required_error: "Selecciona el departamento",
});

export const speciesEnum = z.enum(["perro", "gato", "ave", "otro"], {
  required_error: "Selecciona la especie",
});

export const sexEnum = z.enum(["macho", "hembra", "desconocido"]);
export const sizeEnum = z.enum(["pequeno", "mediano", "grande"]);

/** Campo de texto opcional ("" se interpreta como vacío). */
export const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres`).optional();

export const optionalPhone = (label: string) =>
  z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .regex(PHONE_RE, `${label} no válido (usa números, +, espacios)`),
    ])
    .optional();

export const optionalEmail = z
  .union([
    z.literal(""),
    z.string().trim().email("Correo electrónico no válido"),
  ])
  .optional();

/** Fecha (string) válida y no futura. */
export const pastOrTodayDate = z
  .string()
  .min(1, "Indica la fecha")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha no válida")
  .refine((v) => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return new Date(v) <= d;
  }, "La fecha no puede ser futura");

/** Fecha (string) opcional; si se indica, debe ser válida y no futura. */
export const optionalPastDate = z
  .union([
    z.literal(""),
    z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha no válida")
      .refine((v) => {
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        return new Date(v) <= d;
      }, "La fecha no puede ser futura"),
  ])
  .optional();

/** Convierte "" o undefined en null (para columnas de la BD). */
export const nullIfEmpty = (v: string | undefined | null) =>
  v && v.trim() !== "" ? v.trim() : null;
