"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, ImagePlus, Loader2, X } from "lucide-react";

import { createNews, updateNews } from "@/app/admin/noticias/actions";
import { NEWS_CATEGORIES } from "@/lib/constants/news";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/constants/pets";
import { compressImage } from "@/lib/images/compress";
import { newsImageUrl, uploadNewsImage } from "@/lib/storage/news";
import { isSupabaseConfigured } from "@/lib/env";
import { type NewsCategoryEnum, type NewsStatusEnum } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewsFormState {
  title: string;
  excerpt: string;
  content: string;
  category: NewsCategoryEnum;
  isFeatured: boolean;
  publishedDate: string;
  tags: string;
  status: NewsStatusEnum;
  cover: string;
}

interface Props {
  mode: "create" | "edit";
  id?: string;
  initial: NewsFormState;
}

const ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

export function NewsForm({ mode, id, initial }: Props) {
  const router = useRouter();
  const [values, setValues] = React.useState<NewsFormState>(initial);
  const [newImage, setNewImage] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const newPreview = React.useMemo(
    () => (newImage ? URL.createObjectURL(newImage) : null),
    [newImage],
  );
  React.useEffect(() => {
    return () => {
      if (newPreview) URL.revokeObjectURL(newPreview);
    };
  }, [newPreview]);

  const previewSrc =
    newPreview ?? (values.cover ? newsImageUrl(values.cover) : null);

  function set<K extends keyof NewsFormState>(key: K, value: NewsFormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function removeImage() {
    setNewImage(null);
    set("cover", "");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError("Supabase aún no está configurado.");
      return;
    }

    setSaving(true);
    try {
      let cover = values.cover;
      if (newImage) {
        cover = await uploadNewsImage(await compressImage(newImage));
      }

      const payload = { ...values, cover };
      const result =
        mode === "create"
          ? await createNews(payload)
          : await updateNews(id!, payload);

      if (!result.success) {
        setError(result.error);
        setSaving(false);
        return;
      }
      router.push("/admin/noticias");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error al guardar.",
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Imagen */}
      <div className="space-y-2">
        <Label>Imagen de portada</Label>
        {previewSrc ? (
          <div className="border-border bg-muted relative aspect-[16/9] overflow-hidden rounded-xl border">
            <Image
              src={previewSrc}
              alt="Portada"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              aria-label="Quitar imagen"
              className="bg-foreground/70 text-background absolute top-2 right-2 grid size-8 place-items-center rounded-full"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="border-input bg-muted/30 hover:border-primary/60 flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors"
          >
            <ImagePlus className="text-primary size-6" aria-hidden="true" />
            <span className="text-sm font-medium">Subir imagen</span>
            <span className="text-muted-foreground text-xs">
              JPG, PNG o WebP
            </span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setNewImage(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="news-title">Título</Label>
        <Input
          id="news-title"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="news-excerpt">Resumen</Label>
        <Input
          id="news-excerpt"
          value={values.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          placeholder="Una línea que resuma la noticia"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="news-content">Contenido</Label>
        <Textarea
          id="news-content"
          rows={10}
          value={values.content}
          onChange={(e) => set("content", e.target.value)}
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="news-category">Categoría</Label>
          <Select
            value={values.category}
            onValueChange={(v) => set("category", v as NewsCategoryEnum)}
          >
            <SelectTrigger id="news-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NEWS_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="news-date">Fecha de publicación</Label>
          <Input
            id="news-date"
            type="date"
            value={values.publishedDate}
            onChange={(e) => set("publishedDate", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="news-tags">Etiquetas</Label>
          <Input
            id="news-tags"
            value={values.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="separadas, por, comas"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="news-status">Estado</Label>
          <Select
            value={values.status}
            onValueChange={(v) => set("status", v as NewsStatusEnum)}
          >
            <SelectTrigger id="news-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="publicado">Publicado</SelectItem>
              <SelectItem value="archivado">Archivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={values.isFeatured}
          onChange={(e) => set("isFeatured", e.target.checked)}
          className="border-input accent-primary size-4 rounded"
        />
        Destacar en portada
      </label>

      {error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="border-border flex justify-end border-t pt-6">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {saving
            ? "Guardando…"
            : mode === "create"
              ? "Crear noticia"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
