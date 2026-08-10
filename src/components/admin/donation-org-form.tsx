"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

import {
  createDonationOrg,
  updateDonationOrg,
} from "@/app/admin/donaciones/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface DonationOrgFormInitial {
  name: string;
  url: string;
  urlLabel: string;
  instagram: string;
  description: string;
  sortOrder: number;
  isPublished: boolean;
}

const EMPTY: DonationOrgFormInitial = {
  name: "",
  url: "",
  urlLabel: "",
  instagram: "",
  description: "",
  sortOrder: 0,
  isPublished: true,
};

export function DonationOrgForm({
  mode,
  id,
  initial = EMPTY,
}: {
  mode: "create" | "edit";
  id?: string;
  initial?: DonationOrgFormInitial;
}) {
  const router = useRouter();
  const [v, setV] = React.useState<DonationOrgFormInitial>(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function set<K extends keyof DonationOrgFormInitial>(
    key: K,
    value: DonationOrgFormInitial[K],
  ) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!v.name.trim() || !v.url.trim()) {
      setError("El nombre y el enlace son obligatorios.");
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
          ? await createDonationOrg(v)
          : await updateDonationOrg(id!, v);
      if (!result.success) {
        setError(result.error);
        setSaving(false);
        return;
      }
      router.push("/admin/donaciones");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label="Nombre" required>
        <Input
          value={v.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ej. Cruz Roja Colombiana"
          required
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Enlace para donar (URL)" required>
          <Input
            value={v.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://www.organizacion.org/donar"
            required
          />
        </Field>
        <Field label="Texto del enlace (sin https://)" required>
          <Input
            value={v.urlLabel}
            onChange={(e) => set("urlLabel", e.target.value)}
            placeholder="organizacion.org/donar"
            required
          />
        </Field>
        <Field label="Instagram (usuario sin @)">
          <Input
            value={v.instagram}
            onChange={(e) => set("instagram", e.target.value)}
            placeholder="organizacion"
          />
        </Field>
        <Field label="Orden (menor = aparece primero)">
          <Input
            type="number"
            min={0}
            value={v.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
          />
        </Field>
      </div>

      <Field label="Descripción" required>
        <Textarea
          rows={3}
          value={v.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Breve descripción de la organización."
          required
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={v.isPublished}
          onChange={(e) => set("isPublished", e.target.checked)}
          className="size-4"
        />
        Publicada (visible al público)
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
              ? "Agregar organización"
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
