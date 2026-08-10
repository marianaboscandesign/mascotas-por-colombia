import "server-only";

import { unstable_cache } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { REVALIDATE, TAGS } from "@/lib/cache/tags";
import { type Database } from "@/types/database";

export type Volunteer = Database["public"]["Tables"]["volunteers"]["Row"];
export type PublicVolunteer =
  Database["public"]["Views"]["public_volunteers"]["Row"];

/**
 * Lista todas las personas voluntarias (directorio del panel admin).
 * RLS exige sesión de administrador para leer esta tabla.
 */
export async function getAllVolunteersForAdmin(): Promise<Volunteer[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("volunteers")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

/**
 * Directorio PÚBLICO de voluntarios. Lee la vista `public_volunteers`, que
 * solo expone a los voluntarios activos que aceptaron mostrar al menos un
 * canal de contacto (public_contact), con esos canales ya enmascarados.
 */
export const getPublicVolunteers = unstable_cache(
  async (role?: string): Promise<PublicVolunteer[]> => {
    if (!isSupabaseConfigured) return [];

    const supabase = createPublicClient();
    let query = supabase
      .from("public_volunteers")
      .select("*")
      .order("created_at", { ascending: false });

    if (role) query = query.contains("skills", [role]);

    const { data, error } = await query;
    if (error) return [];
    return data ?? [];
  },
  ["public-volunteers"],
  { tags: [TAGS.volunteers], revalidate: REVALIDATE.content },
);
