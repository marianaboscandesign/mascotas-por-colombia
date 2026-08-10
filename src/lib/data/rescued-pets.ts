import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { type Database } from "@/types/database";

export type RescuedPet = Database["public"]["Tables"]["rescued_pets"]["Row"];

/** Obtiene una mascota rescatada por id (solo no eliminadas). */
export async function getRescuedPetById(
  id: string,
): Promise<RescuedPet | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rescued_pets")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return null;
  return data;
}
