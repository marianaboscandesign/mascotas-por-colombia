import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { type Database } from "@/types/database";

export type ActivityLog = Database["public"]["Tables"]["activity_log"]["Row"];

export interface ActivityEntry {
  action: string;
  summary: string;
  table: string;
  recordId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Registra una acción en el historial. Nunca lanza: si el log falla (p. ej. la
 * tabla aún no existe), no debe bloquear la acción principal del moderador.
 */
export async function logActivity(entry: ActivityEntry): Promise<void> {
  try {
    if (!isSupabaseConfigured) return;
    const admin = await getCurrentAdmin();
    if (!admin) return;

    const supabase = await createClient();
    await supabase.from("activity_log").insert({
      actor_id: admin.id,
      actor_name: admin.full_name,
      action: entry.action,
      summary: entry.summary,
      table_name: entry.table,
      record_id: entry.recordId ?? null,
      old_value:
        (entry.oldValue as Database["public"]["Tables"]["activity_log"]["Insert"]["old_value"]) ??
        null,
      new_value:
        (entry.newValue as Database["public"]["Tables"]["activity_log"]["Insert"]["new_value"]) ??
        null,
    });
  } catch {
    /* silencioso: el historial es secundario */
  }
}

/** Historial reciente (equipo). */
export async function getActivityLog(limit = 100): Promise<ActivityLog[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data ?? [];
}
