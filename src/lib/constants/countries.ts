/** País con su código telefónico (sin el "+"). Para el selector de teléfono. */
export interface Country {
  name: string;
  dial: string;
}

/** Prefijo por defecto (Colombia). */
export const DEFAULT_DIAL = "57";

/**
 * Lista de países para el selector de prefijo telefónico. Colombia primero
 * (la mayoría de los casos) y el resto en orden alfabético. "+1" cubre
 * Estados Unidos, Canadá, R. Dominicana y Puerto Rico (se escribe el área).
 */
export const COUNTRIES: Country[] = [
  { name: "Colombia", dial: "57" },
  { name: "Argentina", dial: "54" },
  { name: "Bolivia", dial: "591" },
  { name: "Brasil", dial: "55" },
  { name: "Chile", dial: "56" },
  { name: "Costa Rica", dial: "506" },
  { name: "Cuba", dial: "53" },
  { name: "Ecuador", dial: "593" },
  { name: "El Salvador", dial: "503" },
  { name: "España", dial: "34" },
  { name: "Estados Unidos / Canadá", dial: "1" },
  { name: "Guatemala", dial: "502" },
  { name: "Honduras", dial: "504" },
  { name: "Italia", dial: "39" },
  { name: "México", dial: "52" },
  { name: "Nicaragua", dial: "505" },
  { name: "Panamá", dial: "507" },
  { name: "Paraguay", dial: "595" },
  { name: "Perú", dial: "51" },
  { name: "Portugal", dial: "351" },
  { name: "Uruguay", dial: "598" },
];
