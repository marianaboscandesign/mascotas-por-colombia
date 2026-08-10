import "server-only";

import { unstable_cache } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { REVALIDATE, TAGS } from "@/lib/cache/tags";
import { type Database } from "@/types/database";

export type FreeVetService =
  Database["public"]["Tables"]["free_vet_services"]["Row"];

/**
 * Servicios veterinarios gratuitos publicados (directorio público). Cliente sin
 * cookies + Data Cache: no reconsulta Supabase si el dato ya está en caché
 * (se invalida al editar desde el admin → etiqueta `vets`).
 */
export const getFreeVetServices = unstable_cache(
  async (): Promise<FreeVetService[]> => {
    if (!isSupabaseConfigured) return [];

    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("free_vet_services")
      .select("*")
      .is("deleted_at", null)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data ?? [];
  },
  ["free-vet-services"],
  { tags: [TAGS.vets], revalidate: REVALIDATE.content },
);

/** Todos los servicios (panel admin; RLS exige sesión de administrador). */
export async function getAllFreeVetsForAdmin(): Promise<FreeVetService[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("free_vet_services")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

/** Un servicio por id (panel admin). */
export async function getFreeVetById(
  id: string,
): Promise<FreeVetService | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("free_vet_services")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return null;
  return data;
}
