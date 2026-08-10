import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { REVALIDATE, TAGS } from "@/lib/cache/tags";
import {
  type Database,
  type PetSpeciesEnum,
  type ColombiaDepartmentEnum,
} from "@/types/database";

export type FoundPet = Database["public"]["Tables"]["found_pets"]["Row"];

export interface FoundPetFilters {
  city?: string;
  species?: PetSpeciesEnum;
  color?: string;
  state?: ColombiaDepartmentEnum;
  page?: number;
  pageSize?: number;
}

const LIST_LIMIT = 60;

/**
 * Columnas que realmente usa la tarjeta del listado (FoundPetCard) + las que
 * necesita la URL amigable. Evita traer `*` (contacto, GPS, video, salud,
 * marcas…) en cada fila del listado: menos ancho de banda y menos lectura.
 */
const LIST_COLS =
  "id, name, species, breed, color, city, state, sector, description, photos, is_featured, found_at, status";

/** Fila ligera usada para calcular rangos y resolver slugs. */
type LightFoundPet = {
  id: string;
  name: string | null;
  species: "perro" | "gato" | "ave" | "otro";
  city: string | null;
  state: string | null;
  created_at: string;
};

/** slugify local (idéntico a lib/utils) para no importar código de cliente. */
function slugifyLocal(text: string): string {
  return text
    .toString()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Lee UNA sola vez (paginado) la versión ligera de todas las encontradas no
 * eliminadas, ordenadas por antigüedad. Memoizado por request con `cache()`:
 * `getFoundPetRanks` y `getFoundPetById` (por slug) lo comparten en un mismo
 * render en vez de escanear la tabla dos veces.
 */
const getAllLightFoundPets = cache(
  unstable_cache(
    async (): Promise<LightFoundPet[]> => {
      if (!isSupabaseConfigured) return [];

      const supabase = createPublicClient();
      const all: LightFoundPet[] = [];
      let page = 0;
      const pageSize = 1000;

      while (true) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from("found_pets")
          .select("id, name, species, city, state, created_at")
          .is("deleted_at", null)
          .order("created_at", { ascending: true })
          .range(from, to);

        if (error) return all;
        if (!data || data.length === 0) break;
        all.push(...(data as unknown as LightFoundPet[]));
        if (data.length < pageSize) break;
        page++;
      }

      return all;
    },
    ["light-found-pets"],
    { tags: [TAGS.pets], revalidate: REVALIDATE.pets },
  ),
);

/** Lista reportes de mascotas encontradas con filtros opcionales y paginación. */
export const getFoundPets = unstable_cache(
  async (
    filters: FoundPetFilters = {},
  ): Promise<{ items: FoundPet[]; total: number }> => {
    const empty = { items: [], total: 0 };
    if (!isSupabaseConfigured) return empty;

    const supabase = createPublicClient();
    let query = supabase
      .from("found_pets")
      .select(LIST_COLS, { count: "exact" })
      .is("deleted_at", null)
      .order("is_imported", { ascending: true })
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.species) query = query.eq("species", filters.species);
    if (filters.state) query = query.eq("state", filters.state);
    if (filters.city) query = query.ilike("city", `%${filters.city}%`);
    if (filters.color) query = query.ilike("color", `%${filters.color}%`);

    const { page, pageSize } = filters;
    if (page !== undefined && pageSize !== undefined) {
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);
    } else {
      query = query.limit(LIST_LIMIT);
    }

    const { data, count, error } = await query;
    if (error) return empty;

    const ranks = await getFoundPetRanks();
    const items = (data ?? []).map((pet) => ({
      ...pet,
      rank: ranks.get((pet as { id: string }).id) || 1,
    })) as unknown as FoundPet[];

    return {
      items,
      total: count ?? 0,
    };
  },
  ["found-pets"],
  { tags: [TAGS.pets], revalidate: REVALIDATE.pets },
);

/** Calcula el orden de creación (rango) para evitar colisiones de slugs */
export const getFoundPetRanks = cache(
  async (): Promise<Map<string, number>> => {
    const ranks = new Map<string, number>();
    const allData = await getAllLightFoundPets();

    const groups: Record<string, string[]> = {};
    for (const pet of allData) {
      const nameSlug = slugifyLocal(
        pet.name ||
          (pet.species === "perro"
            ? "perro"
            : pet.species === "gato"
              ? "gato"
              : pet.species === "ave"
                ? "ave"
                : "mascota"),
      );
      const citySlug = pet.city
        ? slugifyLocal(pet.city)
        : pet.state
          ? slugifyLocal(pet.state)
          : "";
      const key = `${nameSlug}-${citySlug}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(pet.id);
    }

    for (const key in groups) {
      const ids = groups[key];
      if (ids) {
        ids.forEach((id, index) => {
          ranks.set(id, index + 1);
        });
      }
    }

    return ranks;
  },
);

/** Obtiene un reporte de mascota encontrada por id (solo no eliminados). */
export async function getFoundPetById(
  idOrSlug: string,
): Promise<(FoundPet & { rank?: number }) | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug,
    );

  if (isUuid) {
    const { data, error } = await supabase
      .from("found_pets")
      .select("*")
      .eq("id", idOrSlug)
      .is("deleted_at", null)
      .maybeSingle();
    if (error || !data) return null;
    const ranks = await getFoundPetRanks();
    return { ...data, rank: ranks.get(data.id) || 1 };
  }

  // Es un slug. Buscamos si tiene el formato con sufijo numérico al final (ej: "-2")
  const match = idOrSlug.match(/(.+)-(\d+)$/);
  let baseSlug = idOrSlug;
  let targetRank = 1;
  if (match && match[1] && match[2]) {
    baseSlug = match[1];
    targetRank = parseInt(match[2], 10);
  }

  // Reusa la lectura ligera memoizada (misma que getFoundPetRanks): no vuelve a
  // escanear la tabla para resolver el slug.
  const allPets = await getAllLightFoundPets();
  const ranks = await getFoundPetRanks();

  const matchPet = allPets.find((pet) => {
    const nameSlug = slugifyLocal(
      pet.name ||
        (pet.species === "perro"
          ? "perro"
          : pet.species === "gato"
            ? "gato"
            : pet.species === "ave"
              ? "ave"
              : "mascota"),
    );
    const citySlug = pet.city
      ? slugifyLocal(pet.city)
      : pet.state
        ? slugifyLocal(pet.state)
        : "";
    const slugParts = [nameSlug, citySlug].filter(Boolean);
    const candidateBase = slugParts.join("-");
    const petRank = ranks.get(pet.id) || 1;

    return candidateBase === baseSlug && petRank === targetRank;
  });

  if (!matchPet) return null;

  const { data: fullPet, error: fullError } = await supabase
    .from("found_pets")
    .select("*")
    .eq("id", matchPet.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (fullError || !fullPet) return null;
  return { ...fullPet, rank: targetRank };
}
