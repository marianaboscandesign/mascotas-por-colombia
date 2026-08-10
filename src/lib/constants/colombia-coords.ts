import { type ColombiaDepartmentEnum } from "@/types/database";

/**
 * Coordenadas aproximadas (centroide) de cada departamento de Colombia.
 * Se usan como ubicación de respaldo en el mapa cuando una mascota no tiene
 * coordenadas GPS exactas (la mayoría solo tiene departamento/ciudad). Junto con
 * un pequeño desplazamiento determinista evita que todas caigan en el mismo punto.
 */
export const COLOMBIA_DEPARTMENT_COORDS: Record<
  ColombiaDepartmentEnum,
  [number, number]
> = {
  Amazonas: [-1.0, -71.5],
  Antioquia: [6.9, -75.5],
  Arauca: [6.7, -71.0],
  Atlántico: [10.7, -74.9],
  "Bogotá D.C.": [4.65, -74.1],
  Bolívar: [8.7, -74.3],
  Boyacá: [5.7, -73.0],
  Caldas: [5.3, -75.4],
  Caquetá: [0.9, -74.0],
  Casanare: [5.4, -71.6],
  Cauca: [2.5, -76.9],
  Cesar: [9.4, -73.6],
  Chocó: [5.7, -76.7],
  Córdoba: [8.3, -75.7],
  Cundinamarca: [4.9, -74.3],
  Guainía: [2.6, -68.9],
  Guaviare: [1.9, -72.6],
  Huila: [2.5, -75.5],
  "La Guajira": [11.4, -72.4],
  Magdalena: [10.2, -74.3],
  Meta: [3.4, -73.1],
  Nariño: [1.4, -77.5],
  "Norte de Santander": [8.1, -72.9],
  Putumayo: [0.5, -76.4],
  Quindío: [4.5, -75.7],
  Risaralda: [5.1, -75.9],
  "San Andrés y Providencia": [12.55, -81.7],
  Santander: [6.8, -73.2],
  Sucre: [9.1, -75.1],
  Tolima: [4.1, -75.2],
  "Valle del Cauca": [3.8, -76.4],
  Vaupés: [0.7, -70.6],
  Vichada: [4.9, -69.4],
};

/**
 * Desplazamiento determinista (±~0.18°) a partir de un id, para dispersar las
 * mascotas alrededor del centroide de su departamento sin que se solapen.
 */
export function coordJitter(id: string): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const latOff = ((h % 1000) / 1000 - 0.5) * 0.36;
  const lngOff = (((h >> 10) % 1000) / 1000 - 0.5) * 0.36;
  return [latOff, lngOff];
}
