"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";

import { createShelter, updateShelter } from "@/app/admin/refugios/actions";
import { registerShelter } from "@/app/refugios/actions";
import { SHELTER_KINDS, SHELTER_NEEDS } from "@/lib/constants/shelters";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/constants/pets";
import { compressImage } from "@/lib/images/compress";
import { shelterImageUrl, uploadShelterImage } from "@/lib/storage/shelters";
import { isSupabaseConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";
import {
  type ShelterKindEnum,
  type ShelterNeedEnum,
  type ShelterStatusEnum,
} from "@/types/database";
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

export interface ShelterFormInitial {
  name: string;
  kind: ShelterKindEnum;
  country: string;
  city: string;
  region: string;
  address: string;
  description: string;
  managerName: string;
  schedule: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  instagram: string;
  facebook: string;
  status: ShelterStatusEnum;
  needs: ShelterNeedEnum[];
  logoUrl: string;
}

const EMPTY: ShelterFormInitial = {
  name: "",
  kind: "refugio",
  country: "Colombia",
  city: "",
  region: "",
  address: "",
  description: "",
  managerName: "",
  schedule: "",
  email: "",
  phone: "",
  whatsapp: "",
  website: "",
  instagram: "",
  facebook: "",
  status: "verificado",
  needs: [],
  logoUrl: "",
};

const ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

export function ShelterForm({
  mode,
  id,
  initial = EMPTY,
  variant = "admin",
}: {
  mode: "create" | "edit";
  id?: string;
  initial?: ShelterFormInitial;
  variant?: "admin" | "public";
}) {
  const router = useRouter();
  const isPublic = variant === "public";
  const [v, setV] = React.useState<ShelterFormInitial>(initial);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [aiModalOpen, setAiModalOpen] = React.useState(false);

  function handleAiData(data: Partial<ShelterFormInitial>) {
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

  function set<K extends keyof ShelterFormInitial>(
    key: K,
    value: ShelterFormInitial[K],
  ) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  function toggleNeed(need: ShelterNeedEnum) {
    setV((prev) => ({
      ...prev,
      needs: prev.needs.includes(need)
        ? prev.needs.filter((n) => n !== need)
        : [...prev.needs, need],
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!v.name.trim() || !v.country.trim() || !v.city.trim()) {
      setError("Nombre, país y ciudad son obligatorios.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("Supabase aún no está configurado.");
      return;
    }

    setSaving(true);
    try {
      let logoUrl = v.logoUrl;
      if (logoFile)
        logoUrl = await uploadShelterImage(
          await compressImage(logoFile),
          "logos",
        );

      const payload = { ...v, logoUrl };

      if (isPublic) {
        const result = await registerShelter(payload);
        if (!result.success) {
          setError(result.error);
          setSaving(false);
          return;
        }
        setDone(true);
        return;
      }

      const result =
        mode === "create"
          ? await createShelter(payload)
          : await updateShelter(id!, payload);

      if (!result.success) {
        setError(result.error);
        setSaving(false);
        return;
      }
      router.push("/admin/refugios");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error al guardar.",
      );
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="border-success/30 bg-success/10 flex flex-col items-center rounded-2xl border p-8 text-center">
        <span className="bg-success/15 text-success grid size-14 place-items-center rounded-full">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="font-heading mt-5 text-xl font-semibold">
          ¡Registro recibido!
        </h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Gracias por sumar tu centro de acopio. Nuestro equipo lo revisará y,
          una vez verificado, aparecerá en el directorio público.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <AiAutofillCard onClick={() => setAiModalOpen(true)} entityName="refugio" />
      <AiAutofillModal
        isOpen={aiModalOpen}
        onOpenChange={setAiModalOpen}
        entityType="shelter"
        onDataExtracted={handleAiData}
      />

      {/* Logo */}
      <div className="max-w-xs">
        <ImageField
          label="Logo"
          aspect="aspect-square"
          file={logoFile}
          existingUrl={v.logoUrl ? shelterImageUrl(v.logoUrl) : null}
          onSelect={setLogoFile}
          onClear={() => {
            setLogoFile(null);
            set("logoUrl", "");
          }}
        />
      </div>

      {/* Datos básicos */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Nombre de la organización o refugio"
          required
          className="sm:col-span-2"
        >
          <Input
            value={v.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </Field>
        <Field label="¿Qué tipo de organización es?" className="sm:col-span-2">
          <div className="grid gap-2 sm:grid-cols-3">
            {SHELTER_KINDS.map((k) => {
              const active = v.kind === k.value;
              return (
                <button
                  key={k.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set("kind", k.value)}
                  className={cn(
                    "focus-visible:ring-ring flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    active
                      ? "border-primary bg-primary/5 ring-primary ring-1"
                      : "border-border bg-background hover:border-primary/50",
                  )}
                >
                  <span className="text-sm font-semibold">{k.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {k.description}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="País del centro de acopio" required>
          <Input
            value={v.country}
            onChange={(e) => set("country", e.target.value)}
            placeholder="Colombia"
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
        <Field label="Estado / Provincia" className="sm:col-span-2">
          <Input
            value={v.region}
            onChange={(e) => set("region", e.target.value)}
            placeholder="Ej. Antioquia, Medellín, Bogotá…"
          />
          <p className="text-muted-foreground text-xs">
            El centro de acopio puede estar en cualquier país. Indica aquí su
            estado o provincia.
          </p>
        </Field>
        <Field label="Dirección del centro de acopio" className="sm:col-span-2">
          <Input
            value={v.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Dónde recibir/dejar las donaciones"
          />
        </Field>
        <Field label="Descripción" className="sm:col-span-2">
          <Textarea
            rows={4}
            value={v.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        <Field label="Responsable">
          <Input
            value={v.managerName}
            onChange={(e) => set("managerName", e.target.value)}
          />
        </Field>
        <Field label="Horario de acopio">
          <Input
            value={v.schedule}
            onChange={(e) => set("schedule", e.target.value)}
            placeholder="Ej. Lun a Sáb, 9am - 5pm (para llevar donaciones)"
          />
        </Field>
      </div>

      {/* Contacto */}
      <fieldset className="space-y-5">
        <legend className="font-heading text-lg font-semibold">Contacto</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Correo">
            <Input
              type="email"
              value={v.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="WhatsApp">
            <Input
              type="tel"
              value={v.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="0412 0000000"
            />
            <p className="text-muted-foreground text-xs">
              Colombia: con 0 (0414…). Otros países: con + y código (+1 305…).
            </p>
          </Field>
          <Field label="Teléfono">
            <Input
              type="tel"
              value={v.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Sitio web">
            <Input
              type="url"
              value={v.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Instagram (URL)">
            <Input
              type="url"
              value={v.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              placeholder="https://instagram.com/…"
            />
          </Field>
          <Field label="Facebook (URL)">
            <Input
              type="url"
              value={v.facebook}
              onChange={(e) => set("facebook", e.target.value)}
              placeholder="https://facebook.com/…"
            />
          </Field>
        </div>
      </fieldset>

      {/* Necesidades */}
      <fieldset className="space-y-3">
        <legend className="font-heading text-lg font-semibold">
          ¿Qué necesita el centro de acopio?
        </legend>
        <div className="flex flex-wrap gap-2">
          {SHELTER_NEEDS.map((need) => {
            const active = v.needs.includes(need.value);
            return (
              <button
                key={need.value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleNeed(need.value)}
                className={cn(
                  "focus-visible:ring-ring rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50",
                )}
              >
                {need.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {!isPublic && (
        <Field label="Estado de publicación" className="max-w-sm">
          <Select
            value={v.status}
            onValueChange={(val) => set("status", val as ShelterStatusEnum)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="verificado">
                Verificado (visible al público)
              </SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="suspendido">Suspendido (oculto)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}

      {isPublic && (
        <p className="text-muted-foreground border-border rounded-lg border border-dashed p-3 text-sm">
          Al enviar, tu centro de acopio quedará <strong>pendiente</strong> de
          revisión. Lo verificaremos y luego aparecerá en el directorio público.
        </p>
      )}

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
        <Button
          type="submit"
          disabled={saving}
          size={isPublic ? "lg" : "default"}
        >
          {saving && <Loader2 className="animate-spin" />}
          {saving
            ? isPublic
              ? "Enviando…"
              : "Guardando…"
            : isPublic
              ? "Enviar registro"
              : mode === "create"
                ? "Crear refugio"
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

function ImageField({
  label,
  aspect,
  file,
  existingUrl,
  onSelect,
  onClear,
}: {
  label: string;
  aspect: string;
  file: File | null;
  existingUrl: string | null;
  onSelect: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const preview = React.useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  React.useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const src = preview ?? existingUrl;

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {src ? (
        <div
          className={cn(
            "border-border bg-muted relative overflow-hidden rounded-xl border",
            aspect,
          )}
        >
          <Image
            src={src}
            alt={label}
            fill
            unoptimized
            sizes="320px"
            className="object-cover"
          />
          <button
            type="button"
            onClick={onClear}
            aria-label={`Quitar ${label}`}
            className="bg-foreground/70 text-background absolute top-2 right-2 grid size-8 place-items-center rounded-full"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-input bg-muted/30 hover:border-primary/60 flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-center transition-colors",
            aspect,
          )}
        >
          <ImagePlus className="text-primary size-5" aria-hidden="true" />
          <span className="text-xs font-medium">
            Subir {label.toLowerCase()}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
