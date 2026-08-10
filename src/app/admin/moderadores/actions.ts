"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";

import { getCurrentAdmin } from "@/lib/auth/admin";
import { env, isSupabaseConfigured, serverEnv } from "@/lib/env";
import { logActivity } from "@/lib/data/activity-log";
import {
  createModeratorSchema,
  updateModeratorSchema,
} from "@/lib/validations/moderator";
import { type Database } from "@/types/database";
import { type ActionResult } from "@/types";

async function requireSuperAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "super_admin") return null;
  return admin;
}

/** Cliente con service role (solo servidor) para el Admin API de Auth y RLS bypass. */
function serviceClient() {
  return createServiceClient<Database>(
    env.supabaseUrl,
    serverEnv.supabaseServiceRoleKey ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/** Crea una cuenta de moderador (usuario Auth + fila en administrators). */
export async function createModerator(input: unknown): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const parsed = createModeratorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }
  if (!isSupabaseConfigured || !serverEnv.supabaseServiceRoleKey) {
    return { success: false, error: "El servicio no está disponible." };
  }

  const { fullName, email, password } = parsed.data;
  const svc = serviceClient();

  const { data: created, error: authError } = await svc.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  });
  if (authError || !created.user) {
    return {
      success: false,
      error: authError?.message ?? "No se pudo crear el usuario.",
    };
  }

  const { error: insError } = await svc.from("administrators").insert({
    user_id: created.user.id,
    full_name: fullName.trim(),
    email: email.trim(),
    role: "moderador",
  });
  if (insError) {
    // Revertir el usuario de Auth si no se pudo crear la fila.
    await svc.auth.admin.deleteUser(created.user.id);
    return { success: false, error: insError.message };
  }

  // La persona define su propia contraseña al primer inicio (best-effort: si la
  // columna aún no existe, se ignora sin romper el alta).
  await svc
    .from("administrators")
    .update({ must_change_password: true } as never)
    .eq("user_id", created.user.id);

  await logActivity({
    action: "create_moderator",
    summary: `${admin.full_name} creó al moderador ${fullName.trim()}`,
    table: "administrators",
    recordId: created.user.id,
  });

  revalidatePath("/admin/moderadores");
  return { success: true, data: undefined };
}

/**
 * Edita una cuenta de moderador: nombre, correo y/o contraseña. La contraseña
 * vacía no se cambia. Al cambiar la contraseña se marca `must_change_password`
 * para que la persona defina la suya en el próximo inicio (best-effort: si la
 * columna aún no existe, se ignora sin romper).
 */
export async function updateModerator(input: unknown): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const parsed = updateModeratorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }
  if (!isSupabaseConfigured || !serverEnv.supabaseServiceRoleKey) {
    return { success: false, error: "El servicio no está disponible." };
  }

  const { id, fullName, email, password } = parsed.data;
  const svc = serviceClient();

  const { data: mod, error: findError } = await svc
    .from("administrators")
    .select("user_id, full_name")
    .eq("id", id)
    .eq("role", "moderador")
    .is("deleted_at", null)
    .maybeSingle();
  if (findError || !mod) {
    return { success: false, error: "No se encontró el moderador." };
  }

  // 1) Actualiza la cuenta de Auth (correo y/o contraseña).
  const authUpdate: {
    email?: string;
    password?: string;
    email_confirm?: true;
  } = {};
  if (email) {
    authUpdate.email = email;
    authUpdate.email_confirm = true;
  }
  if (password) authUpdate.password = password;
  if (Object.keys(authUpdate).length > 0) {
    const { error: authError } = await svc.auth.admin.updateUserById(
      mod.user_id,
      authUpdate,
    );
    if (authError) return { success: false, error: authError.message };
  }

  // 2) Actualiza la fila de administrators (nombre y/o correo).
  const dbUpdate: Record<string, unknown> = {};
  if (fullName) dbUpdate.full_name = fullName;
  if (email) dbUpdate.email = email;
  if (Object.keys(dbUpdate).length > 0) {
    const { error: dbError } = await svc
      .from("administrators")
      .update(dbUpdate as never)
      .eq("id", id);
    if (dbError) return { success: false, error: dbError.message };
  }

  // 3) Si se cambió la contraseña, exige que la persona defina la suya al
  //    entrar. Best-effort: si la columna aún no existe, no rompe.
  if (password) {
    await svc
      .from("administrators")
      .update({ must_change_password: true } as never)
      .eq("id", id);
  }

  await logActivity({
    action: "update_moderator",
    summary: `${admin.full_name} actualizó la cuenta de ${fullName?.trim() || mod.full_name}${password ? " (contraseña restablecida)" : ""}`,
    table: "administrators",
    recordId: id,
  });

  revalidatePath("/admin/moderadores");
  return { success: true, data: undefined };
}

/** Activa o desactiva una cuenta de moderador. */
export async function setModeratorActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { success: false, error: "No autorizado." };
  if (!serverEnv.supabaseServiceRoleKey) {
    return { success: false, error: "El servicio no está disponible." };
  }

  const svc = serviceClient();
  const { error } = await svc
    .from("administrators")
    .update({ is_active: active })
    .eq("id", id)
    .eq("role", "moderador");

  if (error) return { success: false, error: error.message };

  await logActivity({
    action: active ? "enable_moderator" : "disable_moderator",
    summary: `${admin.full_name} ${active ? "activó" : "desactivó"} una cuenta de moderador`,
    table: "administrators",
    recordId: id,
  });

  revalidatePath("/admin/moderadores");
  return { success: true, data: undefined };
}
