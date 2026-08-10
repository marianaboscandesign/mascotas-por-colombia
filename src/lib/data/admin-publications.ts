import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { type PetSpeciesEnum, type ColombiaDepartmentEnum } from "@/types/database";

export type PublicationKind = "perdida" | "encontrada";

export interface AdminPublication {
  kind: PublicationKind;
  id: string;
  name: string | null;
  species: PetSpeciesEnum;
  status: string;
  city: string;
  state: ColombiaDepartmentEnum;
  isApproved: boolean;
  isFeatured: boolean;
  cover: string | null;
  createdAt: string;
}

const COLS =
  "id, name, species, status, city, state, is_approved, is_featured, photos, created_at";

/** Lista combinada de publicaciones (perdidas + encontradas) para moderación. */
export async function getAdminPublications(): Promise<AdminPublication[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const [lost, found] = await Promise.all([
    supabase
      .from("lost_pets")
      .select(COLS)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("found_pets")
      .select(COLS)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  type SelRow = {
    id: string;
    name: string | null;
    species: PetSpeciesEnum;
    status: string;
    city: string;
    state: ColombiaDepartmentEnum;
    is_approved: boolean;
    is_featured: boolean;
    photos: string[];
    created_at: string;
  };

  const map = (rows: SelRow[], kind: PublicationKind): AdminPublication[] =>
    rows.map((r) => ({
      kind,
      id: r.id,
      name: r.name,
      species: r.species,
      status: r.status,
      city: r.city,
      state: r.state,
      isApproved: r.is_approved,
      isFeatured: r.is_featured,
      cover: r.photos[0] ?? null,
      createdAt: r.created_at,
    }));

  const items = [
    ...map((lost.data ?? []) as SelRow[], "perdida"),
    ...map((found.data ?? []) as SelRow[], "encontrada"),
  ];
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return items;
}
