"use server";

import { revalidatePath } from "next/cache";

import { bust } from "@/lib/cache/tags";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { newsSchema } from "@/lib/validations/news";
import { slugify } from "@/lib/utils";
import { type NewsStatusEnum } from "@/types/database";
import { type ActionResult } from "@/types";

function parseTags(input?: string): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function resolvePublishedAt(
  status: NewsStatusEnum,
  publishedDate?: string,
): string | null {
  if (status !== "publicado") return null;
  if (publishedDate) return new Date(publishedDate).toISOString();
  return new Date().toISOString();
}

function revalidateNews(slug?: string) {
  revalidatePath("/admin/noticias");
  revalidatePath("/noticias");
  if (slug) revalidatePath(`/noticias/${slug}`);
  bust("news");
}

/** Crea una noticia. */
export async function createNews(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const parsed = newsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }

  const d = parsed.data;
  const supabase = await createClient();
  const baseSlug = slugify(d.title) || "noticia";

  const payload = {
    title: d.title,
    excerpt: d.excerpt?.trim() || null,
    content: d.content,
    cover_url: d.cover?.trim() || null,
    category: d.category,
    is_featured: d.isFeatured,
    tags: parseTags(d.tags),
    status: d.status,
    published_at: resolvePublishedAt(d.status, d.publishedDate),
    author_id: admin.id,
  };

  let { data, error } = await supabase
    .from("news")
    .insert({ ...payload, slug: baseSlug })
    .select("id")
    .single();

  if (error?.code === "23505") {
    const suffix = crypto.randomUUID().slice(0, 6);
    ({ data, error } = await supabase
      .from("news")
      .insert({ ...payload, slug: `${baseSlug}-${suffix}` })
      .select("id")
      .single());
  }

  if (error || !data) {
    return { success: false, error: error?.message ?? "No se pudo crear." };
  }

  revalidateNews();
  return { success: true, data: { id: data.id } };
}

/** Actualiza una noticia (mantiene el slug). */
export async function updateNews(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const parsed = newsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }

  const d = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news")
    .update({
      title: d.title,
      excerpt: d.excerpt?.trim() || null,
      content: d.content,
      cover_url: d.cover?.trim() || null,
      category: d.category,
      is_featured: d.isFeatured,
      tags: parseTags(d.tags),
      status: d.status,
      published_at: resolvePublishedAt(d.status, d.publishedDate),
    })
    .eq("id", id)
    .select("slug")
    .single();

  if (error) return { success: false, error: error.message };

  revalidateNews(data?.slug);
  return { success: true, data: undefined };
}

/** Elimina una noticia (soft delete). */
export async function deleteNews(id: string): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("news")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidateNews();
  return { success: true, data: undefined };
}
