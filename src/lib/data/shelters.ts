import "server-only";

import { unstable_cache } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { REVALIDATE, TAGS } from "@/lib/cache/tags";
import { type Database, type ShelterNeedEnum } from "@/types/database";

export type Shelter = Database["public"]["Tables"]["shelters"]["Row"];

/** Tipo solicitable en el directorio público (sin "ambos", que es transversal). */
export type ShelterKindFilter = "refugio" | "centro_acopio";

/**
 * Refugios verificados para el directorio público. Cliente sin cookies + Data
 * Cache (se invalida al gestionar refugios desde el admin → etiqueta `shelters`).
 */
export const getShelters = unstable_cache(
  async (opts?: {
    need?: ShelterNeedEnum;
    kind?: ShelterKindFilter;
  }): Promise<Shelter[]> => {
    if (!isSupabaseConfigured) return [];

    const supabase = createPublicClient();
    // Solo las columnas que usa ShelterCard: evita traer descripción, redes
    // (jsonb), fotos, portada, dirección, coordenadas, horario, contacto…
    let query = supabase
      .from("shelters")
      .select("id, name, slug, kind, needs, logo_url")
      .is("deleted_at", null)
      .eq("status", "verificado")
      .order("name", { ascending: true });

    if (opts?.need) query = query.contains("needs", [opts.need]);
    // "ambos" cuenta tanto como refugio como centro de acopio.
    if (opts?.kind) query = query.in("kind", [opts.kind, "ambos"]);

    const { data, error } = await query;
    if (error) return [];
    return (data ?? []) as unknown as Shelter[];
  },
  ["shelters-public"],
  { tags: [TAGS.shelters], revalidate: REVALIDATE.content },
);

/** Ficha pública por slug (RLS limita a refugios verificados). */
export async function getShelterBySlug(slug: string): Promise<Shelter | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shelters")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return null;
  return data;
}

/** Todos los refugios (panel admin; RLS exige sesión de administrador). */
export async function getAllSheltersForAdmin(): Promise<Shelter[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shelters")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

/** Un refugio por id (panel admin). */
export async function getShelterById(id: string): Promise<Shelter | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shelters")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return null;
  return data;
}
