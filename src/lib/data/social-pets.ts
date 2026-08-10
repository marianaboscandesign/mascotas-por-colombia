import "server-only";

import { unstable_cache } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { REVALIDATE, TAGS } from "@/lib/cache/tags";
import { type Database } from "@/types/database";

export type SocialPet = Database["public"]["Tables"]["social_pets"]["Row"];

/**
 * Mascotas vistas en redes publicadas y aún sin resolver (público). Cliente sin
 * cookies + Data Cache: se invalida al editar desde el admin (etiqueta `social`).
 */
export const getSocialPets = unstable_cache(
  async (): Promise<SocialPet[]> => {
    if (!isSupabaseConfigured) return [];

    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("social_pets")
      .select("*")
      .is("deleted_at", null)
      .eq("is_published", true)
      .eq("is_resolved", false)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data ?? [];
  },
  ["social-pets"],
  { tags: [TAGS.social], revalidate: REVALIDATE.content },
);

/** Todas las publicaciones (panel admin; RLS exige sesión de administrador). */
export async function getAllSocialPetsForAdmin(): Promise<SocialPet[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_pets")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

/** Una publicación por id (panel admin). */
export async function getSocialPetById(id: string): Promise<SocialPet | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_pets")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return null;
  return data;
}
