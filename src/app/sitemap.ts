import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { routes } from "@/config/navigation";
import { RESCUE_HEROES } from "@/lib/constants/heroes";
import { COLOMBIA_DEPARTMENTS, stateToSlug } from "@/lib/constants/colombia";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getLostPetUrl, getFoundPetUrl } from "@/lib/utils";
import { getLostPetRanks } from "@/lib/data/lost-pets";
import { getFoundPetRanks } from "@/lib/data/found-pets";

const url = (path: string) => `${siteConfig.url}${path === "/" ? "" : path}`;

/**
 * Sitemap dinámico: páginas públicas estáticas (desde `routes`) + fichas
 * indexables de mascotas perdidas/encontradas y centros de acopio verificados.
 * El admin no se incluye (no está en `routes`).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = Object.values(routes).map(
    (path) => ({
      url: url(path),
      lastModified: now,
      changeFrequency: path === "/" ? "daily" : "weekly",
      priority: path === "/" ? 1 : 0.7,
    }),
  );

  // Páginas individuales de héroes caninos (indexables).
  const heroEntries: MetadataRoute.Sitemap = RESCUE_HEROES.map((hero) => ({
    url: url(`/heroes-caninos/${hero.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Páginas long-tail por departamento: "Mascotas perdidas/encontradas en {estado}".
  const stateEntries: MetadataRoute.Sitemap = COLOMBIA_DEPARTMENTS.flatMap((s) => {
    const slug = stateToSlug(s);
    return [
      {
        url: url(`/mascotas/departamento/${slug}`),
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
      {
        url: url(`/found-pets/departamento/${slug}`),
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
    ];
  });

  if (!isSupabaseConfigured)
    return [...staticEntries, ...heroEntries, ...stateEntries];

  try {
    const supabase = await createClient();
    const [lost, found, shelters] = await Promise.all([
      supabase
        .from("lost_pets")
        .select("id, name, species, city, state, updated_at")
        .is("deleted_at", null)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("found_pets")
        .select("id, name, species, city, state, updated_at")
        .is("deleted_at", null)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("shelters")
        .select("slug, updated_at")
        .is("deleted_at", null)
        .eq("status", "verificado")
        .limit(1000),
    ]);

    const [ranksLost, ranksFound] = await Promise.all([
      getLostPetRanks(),
      getFoundPetRanks(),
    ]);

    const dynamic: MetadataRoute.Sitemap = [];
    for (const p of lost.data ?? []) {
      const rank = ranksLost.get(p.id) || 1;
      dynamic.push({
        url: url(getLostPetUrl({ ...p, rank })),
        lastModified: new Date(p.updated_at),
        changeFrequency: "daily",
        priority: 0.6,
      });
    }
    for (const p of found.data ?? []) {
      const rank = ranksFound.get(p.id) || 1;
      dynamic.push({
        url: url(getFoundPetUrl({ ...p, rank })),
        lastModified: new Date(p.updated_at),
        changeFrequency: "daily",
        priority: 0.6,
      });
    }
    for (const s of shelters.data ?? [])
      dynamic.push({
        url: url(`/refugios/${s.slug}`),
        lastModified: new Date(s.updated_at),
        changeFrequency: "weekly",
        priority: 0.6,
      });

    return [...staticEntries, ...heroEntries, ...stateEntries, ...dynamic];
  } catch {
    return [...staticEntries, ...heroEntries, ...stateEntries];
  }
}
