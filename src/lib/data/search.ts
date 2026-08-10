import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  type Database,
  type PetSpeciesEnum,
  type SearchableKind,
  type ColombiaDepartmentEnum,
} from "@/types/database";

export type SearchablePet =
  Database["public"]["Views"]["searchable_pets"]["Row"];

export interface SearchPetsParams {
  q?: string;
  state?: ColombiaDepartmentEnum;
  species?: PetSpeciesEnum;
  kinds?: SearchableKind[];
  page?: number;
  pageSize?: number;
}

export interface SearchPetsResult {
  items: SearchablePet[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const DEFAULT_PAGE_SIZE = 12;

/** Limpia el término para construir el filtro `.or()` de PostgREST sin romperlo. */
function sanitize(term: string): string {
  return term
    .replace(/[,()*\\:%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Búsqueda global sobre la vista unificada `searchable_pets`.
 * Texto libre (nombre, ciudad, color, raza) + filtros de departamento, especie y tipo.
 */
export async function searchPets(
  params: SearchPetsParams,
): Promise<SearchPetsResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    48,
    Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const empty: SearchPetsResult = {
    items: [],
    total: 0,
    page,
    pageSize,
    totalPages: 0,
  };

  if (!isSupabaseConfigured) return empty;

  const supabase = await createClient();
  let query = supabase.from("searchable_pets").select("*", { count: "exact" });

  const q = params.q ? sanitize(params.q) : "";
  if (q) {
    const like = `*${q}*`;
    query = query.or(
      `name.ilike.${like},city.ilike.${like},color.ilike.${like},breed.ilike.${like}`,
    );
  }
  if (params.state) query = query.eq("state", params.state);
  if (params.species) query = query.eq("species", params.species);
  if (params.kinds && params.kinds.length > 0 && params.kinds.length < 3) {
    query = query.in("kind", params.kinds);
  }

  const from = (page - 1) * pageSize;
  query = query
    .order("is_imported", { ascending: true })
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const { data, count, error } = await query;
  if (error) return empty;

  const total = count ?? 0;
  return {
    items: data ?? [],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
