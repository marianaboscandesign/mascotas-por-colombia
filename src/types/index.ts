/**
 * Tipos de dominio de la aplicación.
 * Estos describen las entidades del negocio independientemente de la BD.
 */

/** Estado de un reporte de mascota. */
export type PetStatus = "perdida" | "encontrada" | "reunida";

/** Especie de la mascota. */
export type PetSpecies = "perro" | "gato" | "ave" | "otro";

/** Sexo de la mascota. */
export type PetSex = "macho" | "hembra" | "desconocido";

/** Tamaño aproximado. */
export type PetSize = "pequeno" | "mediano" | "grande";

/** Ubicación geográfica asociada a un reporte. */
export interface GeoLocation {
  state: string; // Estado de Colombia
  city: string;
  reference?: string; // Punto de referencia / sector
  lat?: number;
  lng?: number;
}

/** Datos de contacto de quien publica el reporte. */
export interface ReporterContact {
  name: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
}

/** Reporte de una mascota perdida o encontrada. */
export interface Pet {
  id: string;
  status: PetStatus;
  species: PetSpecies;
  name?: string;
  breed?: string;
  color?: string;
  sex: PetSex;
  size: PetSize;
  description: string;
  photos: string[]; // URLs en Supabase Storage
  location: GeoLocation;
  contact: ReporterContact;
  lastSeenAt?: string; // ISO date
  createdAt: string;
  updatedAt: string;
}

/** Parámetros de búsqueda/filtrado del listado de mascotas. */
export interface PetFilters {
  status?: PetStatus;
  species?: PetSpecies;
  state?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

/** Respuesta paginada genérica. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Resultado estándar para acciones/servidor. */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
