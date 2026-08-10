"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

import { createFreeVet, updateFreeVet } from "@/app/admin/veterinarios/actions";
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
import { AiAutofillCard } from "@/components/ai/ai-autofill-card";
import { AiAutofillModal } from "@/components/ai/ai-autofill-modal";

export interface FreeVetFormInitial {
  name: string;
  description: string;
  city: string;
  state: string;
  region: string;
  sedes: string;
  phones: string;
  whatsapp: string;
  address: string;
  schedule: string;
  source: string;
  validUntil: string;
  isPublished: boolean;
}

const EMPTY: FreeVetFormInitial = {
  name: "",
  description: "",
  city: "",
  state: "",
  region: "",
  sedes: "",
  phones: "",
  whatsapp: "",
  address: "",
  schedule: "",
  source: "",
  validUntil: "",
  isPublished: true,
};

const NONE = "__none__";

export function FreeVetForm({
  mode,
  id,
  initial = EMPTY,
}: {
  mode: "create" | "edit";
  id?: string;
  initial?: FreeVetFormInitial;
}) {
  const router = useRouter();
  const [v, setV] = React.useState<FreeVetFormInitial>(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = React.useState(false);

  function handleAiData(data: Partial<FreeVetFormInitial>) {
    setV((prev) => {
      const next = { ...prev };
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (next as any)[key] = value;
        }
      });
      return next;
    });
  }

  function set<K extends keyof FreeVetFormInitial>(
    key: K,
    value: FreeVetFormInitial[K],
  ) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  function toLines(text: string): string[] {
    return text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!v.name.trim() || !v.city.trim()) {
      setError("Nombre y ciudad son obligatorios.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("Supabase aún no está configurado.");
      return;
    }

    setSaving(true);
    const payload = {
      ...v,
      sedes: toLines(v.sedes),
      phones: toLines(v.phones),
    };
    try {
      const result =
        mode === "create"
          ? await createFreeVet(payload)
          : await updateFreeVet(id!, payload);
      if (!result.success) {
        setError(result.error);
        setSaving(false);
        return;
      }
      router.push("/admin/veterinarios");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <AiAutofillCard onClick={() => setAiModalOpen(true)} entityName="servicio veterinario" />
      <AiAutofillModal
        isOpen={aiModalOpen}
        onOpenChange={setAiModalOpen}
        entityType="free-vet"
        onDataExtracted={handleAiData}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre del servicio" required className="sm:col-span-2">
          <Input
            value={v.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ej. Servicio Veterinario Gratuito Bogotá"
            required
          />
        </Field>
        <Field label="Ciudad" required>
          <Input
            value={v.city}
            onChange={(e) => set("city", e.target.value)}
            required
          />
        </Field>
        <Field label="Departamento">
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
        <Field label="Descripción" className="sm:col-span-2">
          <Textarea
            rows={3}
            value={v.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Qué cubre el servicio, requisitos, etc."
          />
        </Field>
        <Field label="Sedes (una por línea)">
          <Textarea
            rows={4}
            value={v.sedes}
            onChange={(e) => set("sedes", e.target.value)}
            placeholder={"La lagunita\nLos campitos\nSan Luis"}
          />
        </Field>
        <Field label="Teléfonos (uno por línea)">
          <Textarea
            rows={4}
            value={v.phones}
            onChange={(e) => set("phones", e.target.value)}
            placeholder={"0414-2577945\n0212-2577945"}
          />
        </Field>
        <Field label="WhatsApp">
          <Input
            value={v.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="0412 0000000"
          />
          <p className="text-muted-foreground text-xs">
            Colombia: con 0 (0414…). Otros países: con + y código (+1 305…).
          </p>
        </Field>
        <Field label="Horario">
          <Input
            value={v.schedule}
            onChange={(e) => set("schedule", e.target.value)}
            placeholder="Lun a Sáb, 9am - 4pm"
          />
        </Field>
        <Field label="Dirección" className="sm:col-span-2">
          <Input
            value={v.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
        <Field label="Vigente hasta">
          <Input
            type="date"
            value={v.validUntil}
            onChange={(e) => set("validUntil", e.target.value)}
          />
        </Field>
        <Field label="Fuente">
          <Input
            value={v.source}
            onChange={(e) => set("source", e.target.value)}
            placeholder="Ej. VetPrin"
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={v.isPublished}
          onChange={(e) => set("isPublished", e.target.checked)}
          className="size-4"
        />
        Publicado (visible al público)
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
              ? "Crear servicio"
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
