import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export interface ModeratorAccount {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

/** Lista de cuentas de moderador (rol 'moderador'). Solo para super_admin. */
export async function getModerators(): Promise<ModeratorAccount[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("administrators")
    .select("id, user_id, full_name, email, is_active, created_at")
    .eq("role", "moderador")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}
