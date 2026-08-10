"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { updatePublication } from "@/app/admin/publicaciones/actions";
import { type PublicationKind } from "@/lib/data/admin-publications";
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
import { PhoneField } from "@/components/common/phone-field";
import { SEX_OPTIONS } from "@/lib/constants/pets";

interface Props {
  kind: PublicationKind;
  id: string;
  initial: {
    name: string;
    breed: string;
    color: string;
    sex: string;
    description: string;
    city: string;
    sector: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  };
}

export function PublicationEditForm({ kind, id, initial }: Props) {
  const router = useRouter();
  const [values, setValues] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "ok" | "error";
    message: string;
  } | null>(null);

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const result = await updatePublication(kind, id, {
      name: values.name.trim() || null,
      breed: values.breed.trim() || null,
      color: values.color.trim() || null,
      sex: values.sex,
      description: values.description.trim(),
      city: values.city.trim(),
      sector: values.sector.trim() || null,
      contactName: values.contactName.trim() || null,
      contactEmail: values.contactEmail.trim() || null,
      contactPhone: values.contactPhone.trim() || null,
    });
    setSaving(false);
    if (!result.success) {
      setFeedback({ type: "error", message: result.error });
      return;
    }
    setFeedback({ type: "ok", message: "Publicación actualizada." });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre">
          <Input
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Raza">
          <Input
            value={values.breed}
            onChange={(e) => set("breed", e.target.value)}
          />
        </Field>
        <Field label="Color">
          <Input
            value={values.color}
            onChange={(e) => set("color", e.target.value)}
          />
        </Field>
        <Field label="Sexo">
          <Select
            value={values.sex || "desconocido"}
            onValueChange={(v) => set("sex", v)}
          >
            <SelectTrigger aria-label="Sexo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEX_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Ciudad">
          <Input
            value={values.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </Field>
        <Field label="Ubicación / sector" className="sm:col-span-2">
          <Input
            value={values.sector}
            onChange={(e) => set("sector", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Descripción">
        <Textarea
          rows={5}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <fieldset className="space-y-4">
        <legend className="font-heading text-sm font-semibold">
          Datos de contacto
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nombre de contacto">
            <Input
              value={values.contactName}
              onChange={(e) => set("contactName", e.target.value)}
            />
          </Field>
          <Field label="Correo">
            <Input
              type="email"
              value={values.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
          </Field>
          <Field label="Teléfono / WhatsApp">
            <PhoneField
              value={values.contactPhone}
              onChange={(v) => set("contactPhone", v)}
            />
          </Field>
        </div>
        <p className="text-muted-foreground text-xs">
          Elige el país y escribe el número sin el 0 inicial. Se usa para el
          botón de WhatsApp y para llamar.
        </p>
      </fieldset>

      {feedback && (
        <div
          role="alert"
          className={cn(
            "flex items-start gap-2 rounded-lg border p-3 text-sm",
            feedback.type === "ok"
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/5 text-destructive",
          )}
        >
          {feedback.type === "ok" ? (
            <Check className="mt-0.5 size-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
          )}
          <p>{feedback.message}</p>
        </div>
      )}

      <div className="border-border flex justify-end border-t pt-6">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
