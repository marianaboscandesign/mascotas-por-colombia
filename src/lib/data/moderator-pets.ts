import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { petPhotoUrl } from "@/lib/storage/pet-photos";
import { type PublicationKind } from "@/lib/data/admin-publications";

export type ModeratorFilter = "activas" | "pendientes" | "reunidas";

export interface ModeratorPet {
  kind: PublicationKind;
  id: string;
  name: string | null;
  species: string;
  status: string;
  color: string | null;
  description: string | null;
  city: string | null;
  location: string | null; // sector (perdida) / address (encontrada)
  state: string | null;
  phone: string | null;
  isApproved: boolean;
  cover: string | null;
  createdAt: string;
}

interface RawRow {
  id: string;
  name: string | null;
  species: string;
  status: string;
  color: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  is_approved: boolean;
  photos: string[] | null;
  created_at: string;
  sector?: string | null;
  address?: string | null;
  reporter_phone?: string | null;
  reporter_whatsapp?: string | null;
  finder_phone?: string | null;
  finder_whatsapp?: string | null;
}

const LOST_COLS =
  "id, name, species, status, color, description, city, state, sector, reporter_phone, reporter_whatsapp, is_approved, photos, created_at";
const FOUND_COLS =
  "id, name, species, status, color, description, city, state, sector, finder_phone, finder_whatsapp, is_approved, photos, created_at";

interface Params {
  kind?: PublicationKind;
  filter?: ModeratorFilter;
  search?: string;
  limit?: number;
}

/** Mascotas para el panel de moderación, con filtros rápidos y búsqueda. */
export async function getModeratorPets({
  kind,
  filter = "activas",
  search,
  limit = 60,
}: Params): Promise<ModeratorPet[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();

  const q = search?.trim();

  async function fetchKind(k: PublicationKind): Promise<ModeratorPet[]> {
    const table = k === "perdida" ? "lost_pets" : "found_pets";
    let query = supabase
      .from(table)
      .select(k === "perdida" ? LOST_COLS : FOUND_COLS)
      .is("deleted_at", null);

    if (filter === "pendientes") query = query.eq("is_approved", false);
    else if (filter === "reunidas")
      query = query.eq("status", "reunida").eq("is_approved", true);
    else query = query.eq("is_approved", true).neq("status", "reunida");

    if (q) query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%`);

    query = query.order("created_at", { ascending: false }).limit(limit);

    const { data, error } = await query;
    if (error || !data) return [];

    return (data as unknown as RawRow[]).map((r) => ({
      kind: k,
      id: r.id,
      name: r.name,
      species: r.species,
      status: r.status,
      color: r.color,
      description: r.description,
      city: r.city,
      location: r.sector ?? null,
      state: r.state,
      phone:
        k === "perdida"
          ? (r.reporter_phone ?? r.reporter_whatsapp ?? null)
          : (r.finder_phone ?? r.finder_whatsapp ?? null),
      isApproved: r.is_approved,
      cover: r.photos?.[0] ? petPhotoUrl(r.photos[0]) : null,
      createdAt: r.created_at,
    }));
  }

  const kinds: PublicationKind[] = kind ? [kind] : ["perdida", "encontrada"];
  const results = await Promise.all(kinds.map(fetchKind));
  return results
    .flat()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}
