import "server-only";

import { unstable_cache } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { REVALIDATE, TAGS } from "@/lib/cache/tags";
import { type DonationOrg } from "@/lib/constants/donations";
import { type Database } from "@/types/database";

export type DonationOrgRow =
  Database["public"]["Tables"]["donation_orgs"]["Row"];

/** Mapea una fila de BD a la forma que renderiza la página pública. */
function toDonationOrg(row: DonationOrgRow): DonationOrg {
  return {
    name: row.name,
    url: row.url,
    urlLabel: row.url_label,
    instagram: row.instagram ?? "",
    description: row.description,
  };
}

/** Organizaciones publicadas para la página pública de donaciones. */
export const getDonationOrgs = unstable_cache(
  async (): Promise<DonationOrg[]> => {
    if (!isSupabaseConfigured) return [];

    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("donation_orgs")
      .select("*")
      .is("deleted_at", null)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data.map(toDonationOrg);
  },
  ["donation-orgs"],
  { tags: [TAGS.donations], revalidate: REVALIDATE.content },
);

/** Todas las organizaciones (no borradas) para el panel admin. */
export async function getAllDonationOrgsForAdmin(): Promise<DonationOrgRow[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donation_orgs")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return [];
  return data ?? [];
}

/** Una organización por id (admin). */
export async function getDonationOrgById(
  id: string,
): Promise<DonationOrgRow | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donation_orgs")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return null;
  return data;
}
