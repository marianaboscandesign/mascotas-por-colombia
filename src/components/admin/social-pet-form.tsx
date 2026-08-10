"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

import {
  createSocialPet,
  updateSocialPet,
} from "@/app/admin/vistas-en-redes/actions";
import { COLOMBIA_DEPARTMENT_VALUES } from "@/lib/validations/shared";
import { isSupabaseConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";
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

const SPECIES = [
  { value: "perro", label: "Perro" },
  { value: "gato", label: "Gato" },
  { value: "ave", label: "Ave" },
  { value: "otro", label: "Otro" },
] as const;

export interface SocialPetFormInitial {
  videoUrl: string;
  species: string;
  title: string;
  state: string;
  city: string;
  note: string;
  isPublished: boolean;
  isResolved: boolean;
}

const EMPTY: SocialPetFormInitial = {
  videoUrl: "",
  species: "perro",
  title: "",
  state: "",
  city: "",
  note: "",
  isPublished: true,
  isResolved: false,
};

const NONE = "__none__";

export function SocialPetForm({
  mode,
  id,
  initial = EMPTY,
}: {
  mode: "create" | "edit";
  id?: string;
  initial?: SocialPetFormInitial;
}) {
  const router = useRouter();
  const [v, setV] = React.useState<SocialPetFormInitial>(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function set<K extends keyof SocialPetFormInitial>(
    key: K,
    value: SocialPetFormInitial[K],
  ) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!v.videoUrl.trim()) {
      setError("El enlace del video es obligatorio.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("Supabase aún no está configurado.");
      return;
    }

    setSaving(true);
    try {
      const result =
        mode === "create"
          ? await createSocialPet(v)
          : await updateSocialPet(id!, v);
      if (!result.success) {
        setError(result.error);
        setSaving(false);
        return;
      }
      router.push("/admin/vistas-en-redes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label="Enlace del video (TikTok o Instagram)" required>
        <Input
          value={v.videoUrl}
          onChange={(e) => set("videoUrl", e.target.value)}
          placeholder="https://www.tiktok.com/… o https://www.instagram.com/reel/…"
          required
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Especie (opcional)">
          <Select
            value={v.species || NONE}
            onValueChange={(val) => set("species", val === NONE ? "" : val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>
                Sin especie (refugio, causa…)
              </SelectItem>
              {SPECIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Título (opcional)">
          <Input
            value={v.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Ej. Perro mestizo color marrón"
          />
        </Field>
        <Field label="Ciudad">
          <Input value={v.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="Estado">
          <Select
            value={v.state || NONE}
            onValueChange={(val) => set("state", val === NONE ? "" : val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin especificar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin especificar</SelectItem>
              {COLOMBIA_DEPARTMENT_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Nota" className="sm:col-span-2">
          <Textarea
            rows={3}
            value={v.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="Dónde fue visto, estado de la mascota, etc."
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={v.isPublished}
            onChange={(e) => set("isPublished", e.target.checked)}
            className="size-4"
          />
          Publicado (visible al público)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={v.isResolved}
            onChange={(e) => set("isResolved", e.target.checked)}
            className="size-4"
          />
          Ya apareció / resuelto (se oculta del público)
        </label>
      </div>

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
              ? "Agregar video"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
