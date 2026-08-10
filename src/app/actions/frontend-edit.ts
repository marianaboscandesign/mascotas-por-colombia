"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { bustPets } from "@/lib/cache/tags";
import { env, serverEnv } from "@/lib/env";
import { type Database } from "@/types/database";

const DEFAULT_PASSWORD = "adm4040";
const EDIT_PASSWORD = process.env.NEXT_PUBLIC_EDIT_PASSWORD || DEFAULT_PASSWORD;

export interface EditablePetData {
  name: string | null;
  species: "perro" | "gato" | "ave" | "otro";
  breed: string | null;
  color: string | null;
  sex: "macho" | "hembra" | "desconocido";
  size: "pequeno" | "mediano" | "grande";
  age_group: "cachorro" | "joven" | "adulto" | "senior" | null;
  description: string | null;
  distinctive_marks: string | null;
  status: string;
  state: string;
  city: string | null;
  sector: string | null;
  is_approved: boolean;
  is_featured: boolean;
  last_seen_at?: string | null;
  found_at?: string | null;
  reporter_name?: string | null;
  reporter_email?: string | null;
  reporter_phone?: string | null;
  reporter_whatsapp?: string | null;
  finder_name?: string | null;
  finder_email?: string | null;
  finder_phone?: string | null;
  finder_whatsapp?: string | null;
  has_reward?: boolean;
  is_sheltered?: boolean;
}

export async function updatePetFromFrontend(
  id: string,
  kind: "perdida" | "encontrada",
  fields: EditablePetData,
  passwordSaved: string,
) {
  if (passwordSaved !== EDIT_PASSWORD) {
    return { success: false, error: "No autorizado. Contraseña incorrecta." };
  }

  const serviceKey = serverEnv.supabaseServiceRoleKey;
  if (!serviceKey) {
    return {
      success: false,
      error:
        "Error del servidor: SUPABASE_SERVICE_ROLE_KEY no está configurada.",
    };
  }

  // Create standard client with service role key to bypass RLS
  const supabase = createClient<Database>(env.supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
    },
  });

  const table = kind === "perdida" ? "lost_pets" : "found_pets";

  const { error } = await supabase
    .from(table)
    .update(fields as never)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Revalidate paths for real-time frontend updates
  revalidatePath("/");
  revalidatePath("/mascotas");
  revalidatePath("/found-pets");
  revalidatePath(`/mascotas/${id}`);
  revalidatePath(`/found-pets/${id}`);
  revalidatePath("/buscar");
  bustPets();

  return { success: true };
}
