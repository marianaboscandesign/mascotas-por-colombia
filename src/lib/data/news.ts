import "server-only";

import { unstable_cache } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { REVALIDATE, TAGS } from "@/lib/cache/tags";
import { type Database, type NewsCategoryEnum } from "@/types/database";

export type News = Database["public"]["Tables"]["news"]["Row"];

/**
 * Columnas que usa NewsCard en los listados: excluye `content` (el cuerpo
 * completo del artículo, potencialmente muy pesado), que solo hace falta en la
 * ficha (`getNewsBySlug`).
 */
const LIST_COLS =
  "id, title, slug, category, excerpt, cover_url, is_featured, published_at, created_at";

/** Noticias publicadas para el listado público. Cliente sin cookies + Data
 * Cache (se invalida al publicar/editar desde el admin → etiqueta `news`). */
export const getPublishedNews = unstable_cache(
  async (category?: NewsCategoryEnum): Promise<News[]> => {
    if (!isSupabaseConfigured) return [];

    const supabase = createPublicClient();
    let query = supabase
      .from("news")
      .select(LIST_COLS)
      .is("deleted_at", null)
      .eq("status", "publicado")
      .order("published_at", { ascending: false });

    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) return [];
    return (data ?? []) as unknown as News[];
  },
  ["published-news"],
  { tags: [TAGS.news], revalidate: REVALIDATE.content },
);

/** Noticias destacadas y publicadas (portada). */
export const getFeaturedNews = unstable_cache(
  async (limit = 3): Promise<News[]> => {
    if (!isSupabaseConfigured) return [];

    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("news")
      .select(LIST_COLS)
      .is("deleted_at", null)
      .eq("status", "publicado")
      .eq("is_featured", true)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as unknown as News[];
  },
  ["featured-news"],
  { tags: [TAGS.news], revalidate: REVALIDATE.content },
);

/** Una noticia publicada por slug (ficha pública). */
export async function getNewsBySlug(slug: string): Promise<News | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return null;
  return data;
}

/** Todas las noticias (panel admin). */
export async function getAllNewsForAdmin(): Promise<News[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

/** Una noticia por id (panel admin). */
export async function getNewsById(id: string): Promise<News | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return null;
  return data;
}
