import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { type Database } from "@/types/database";

export type ContactMessage =
  Database["public"]["Tables"]["contact_messages"]["Row"];

/** Mensajes del formulario de contacto (solo admin). Más recientes primero. */
export async function getContactMessages(): Promise<ContactMessage[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return [];
  return data ?? [];
}
