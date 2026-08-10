import { Type } from "@google/genai";

/**
 * Versión del algoritmo de ficha visual. Se guarda junto con cada perfil para
 * poder, en el futuro, regenerar SOLO los perfiles con una versión vieja
 * cuando cambiemos el prompt/esquema (sin reprocesar todo). Súbela al cambiar
 * los vocabularios o el prompt de abajo.
 */
export const VISUAL_PROFILE_VERSION = 1;

// ── Vocabularios cerrados ──────────────────────────────────────────
// Gemini SOLO puede devolver estos valores (o null si no es visible). Mantener
// estables: cambiarlos implica subir VISUAL_PROFILE_VERSION.
export const VP = {
  species: ["perro", "gato", "ave", "otro"],
  size: ["pequeno", "mediano", "grande"],
  color: [
    "negro",
    "blanco",
    "marron",
    "dorado",
    "gris",
    "crema",
    "naranja",
    "atigrado",
    "tricolor",
    "manchado",
  ],
  coat_pattern: [
    "solido",
    "bicolor",
    "tricolor",
    "atigrado",
    "manchado",
    "rayado",
  ],
  ear_type: ["paradas", "caidas", "semicaidas", "recortadas", "puntiagudas"],
  tail_type: ["larga", "corta", "enroscada", "esponjada", "sin_cola"],
  nose_color: ["negra", "rosada", "marron", "moteada"],
  eye_color: ["marron", "ambar", "azul", "verde", "heterocromia"],
  age: ["cachorro", "joven", "adulto", "senior"],
  condition: ["saludable", "delgada", "herida", "descuidada"],
  accessories: ["bandana", "placa", "correa", "sueter", "ninguno"],
} as const;

/** Forma de la ficha visual que devuelve Gemini y se guarda en la BD. */
export interface VisualProfile {
  species: (typeof VP.species)[number] | null;
  breed_estimated: string | null;
  size: (typeof VP.size)[number] | null;
  primary_color: (typeof VP.color)[number] | null;
  secondary_color: (typeof VP.color)[number] | null;
  coat_pattern: (typeof VP.coat_pattern)[number] | null;
  ear_type: (typeof VP.ear_type)[number] | null;
  tail_type: (typeof VP.tail_type)[number] | null;
  nose_color: (typeof VP.nose_color)[number] | null;
  eye_color: (typeof VP.eye_color)[number] | null;
  collar: { present: boolean; color: string | null };
  accessories: Array<(typeof VP.accessories)[number]>;
  age_estimate: (typeof VP.age)[number] | null;
  unique_features: string[];
  physical_condition: (typeof VP.condition)[number] | null;
  /** Confianza global del análisis (0–1). */
  confidence: number;
}

const enumStr = (values: readonly string[], desc: string) => ({
  type: Type.STRING,
  enum: [...values],
  nullable: true,
  description: desc,
});

/**
 * Esquema de salida estructurada para Gemini (JSON Schema). Al declararlo, la
 * API obliga a que la respuesta tenga exactamente esta forma y estos valores
 * — nada de texto libre inconsistente.
 */
export const VISUAL_PROFILE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    species: enumStr(VP.species, "Especie del animal."),
    breed_estimated: {
      type: Type.STRING,
      nullable: true,
      description:
        "Raza estimada en minúsculas (ej. 'labrador', 'mestizo'). null si no se puede estimar.",
    },
    size: enumStr(VP.size, "Tamaño aproximado."),
    primary_color: enumStr(VP.color, "Color predominante del pelaje."),
    secondary_color: enumStr(
      VP.color,
      "Segundo color; null si es un solo color.",
    ),
    coat_pattern: enumStr(VP.coat_pattern, "Patrón del pelaje."),
    ear_type: enumStr(VP.ear_type, "Tipo de orejas; null si no se ven."),
    tail_type: enumStr(VP.tail_type, "Tipo de cola; null si no se ve."),
    nose_color: enumStr(VP.nose_color, "Color de la nariz; null si no se ve."),
    eye_color: enumStr(VP.eye_color, "Color de los ojos; null si no se ven."),
    collar: {
      type: Type.OBJECT,
      properties: {
        present: { type: Type.BOOLEAN, description: "¿Lleva collar?" },
        color: {
          type: Type.STRING,
          nullable: true,
          description: "Color del collar.",
        },
      },
      required: ["present"],
    },
    accessories: {
      type: Type.ARRAY,
      items: { type: Type.STRING, enum: [...VP.accessories] },
      description: "Accesorios visibles; ['ninguno'] si no hay.",
    },
    age_estimate: enumStr(VP.age, "Edad aproximada."),
    unique_features: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Rasgos distintivos en texto corto (ej. 'mancha blanca en el pecho', 'oreja izquierda mordida'). Máx 4.",
    },
    physical_condition: enumStr(VP.condition, "Condición física aparente."),
    confidence: {
      type: Type.NUMBER,
      description: "Confianza global del análisis, entre 0 y 1.",
    },
  },
  required: ["species", "confidence"],
};

/** Prompt fijo para el análisis. Cambiarlo implica subir VISUAL_PROFILE_VERSION. */
export const VISUAL_PROFILE_PROMPT = `Eres un asistente veterinario experto en identificación de mascotas. Analiza ÚNICAMENTE al animal principal de la fotografía y completa su ficha visual.

Reglas:
- Usa solo los valores permitidos de cada campo. Si un rasgo NO es claramente visible, devuelve null (no adivines).
- Sé objetivo y consistente: describe lo que se ve, no lo que supones.
- "unique_features": máximo 4 rasgos realmente distintivos y en español breve.
- "confidence": qué tan clara y completa es la foto para este análisis (0 a 1).
Devuelve solo el JSON con el esquema indicado.`;
