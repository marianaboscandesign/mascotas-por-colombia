"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, ChevronDown, Loader2 } from "lucide-react";

import {
  lostPetFieldsSchema,
  type LostPetFormValues,
} from "@/lib/validations/lost-pet";
import {
  MIN_PHOTOS,
  SEX_OPTIONS,
  SIZE_OPTIONS,
  SPECIES_OPTIONS,
} from "@/lib/constants/pets";
import { COLOMBIA_DEPARTMENTS } from "@/lib/constants/colombia";
import { isSupabaseConfigured } from "@/lib/env";
import { compressImage } from "@/lib/images/compress";
import { removePetPhotos, uploadPetPhotos } from "@/lib/storage/pet-photos";
import { createLostPet } from "@/app/reportar/perdida/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneField } from "@/components/common/phone-field";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PhotoUpload } from "@/components/media/photo-upload";
import { AiAutofillCard } from "@/components/ai/ai-autofill-card";
import { AiAutofillModal } from "@/components/ai/ai-autofill-modal";

const todayStr = new Date().toISOString().slice(0, 10);

export function LostPetForm() {
  const router = useRouter();
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [photoError, setPhotoError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [aiModalOpen, setAiModalOpen] = React.useState(false);

  const form = useForm<LostPetFormValues>({
    resolver: zodResolver(lostPetFieldsSchema),
    defaultValues: {
      name: "",
      species: undefined,
      breed: "",
      sex: "desconocido",
      size: undefined,
      color: "",
      description: "",
      state: undefined,
      city: "",
      lastSeenLocation: "",
      lastSeenDate: "",
      reporterName: "",
      reporterPhone: "",
      reporterEmail: "",
    },
  });

  function handleAiData(data: Partial<LostPetFormValues>, images?: File[]) {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        // Enforce strong typing via assertions for form keys
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.setValue(key as keyof LostPetFormValues, value as any, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    });

    if (images && images.length > 0) {
      setPhotos((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const filtered = images.filter((f) => !existingNames.has(f.name));
        return [...prev, ...filtered].slice(0, 3); // Máximo 3 fotos para pérdidas
      });
      setPhotoError(null);
    }
  }

  async function onSubmit(values: LostPetFormValues) {
    setSubmitError(null);
    setPhotoError(null);

    if (photos.length < MIN_PHOTOS) {
      setPhotoError("Sube al menos una foto de tu mascota.");
      return;
    }
    if (!isSupabaseConfigured) {
      setSubmitError(
        "Supabase aún no está configurado. Completa las variables de entorno para enviar el reporte.",
      );
      return;
    }

    setSubmitting(true);
    let uploadedPaths: string[] = [];
    try {
      const optimized = await Promise.all(
        photos.map((file) => compressImage(file)),
      );
      uploadedPaths = await uploadPetPhotos(optimized);

      const result = await createLostPet({ ...values, photos: uploadedPaths });
      if (!result.success) {
        await removePetPhotos(uploadedPaths);
        setSubmitError(result.error);
        setSubmitting(false);
        return;
      }

      // Éxito: navega a la ficha pública recién creada.
      router.push(`/mascotas/${result.data.id}?nuevo=1`);
    } catch (error) {
      await removePetPhotos(uploadedPaths);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al enviar el reporte. Intenta de nuevo.",
      );
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        noValidate
      >
        <p className="bg-secondary/40 text-foreground/80 rounded-xl p-4 text-sm leading-relaxed">
          Para publicar solo necesitas <strong>una foto</strong>, la{" "}
          <strong>especie</strong>, el <strong>estado</strong> y{" "}
          <strong>un medio de contacto</strong>. Lo demás es opcional, pero cada
          dato ayuda a encontrarla más rápido.
        </p>

        <AiAutofillCard
          onClick={() => setAiModalOpen(true)}
          entityName="mascota"
        />
        <AiAutofillModal
          isOpen={aiModalOpen}
          onOpenChange={setAiModalOpen}
          entityType="lost-pet"
          onDataExtracted={handleAiData}
        />

        {/* ── Fotos ── */}
        <FieldGroup
          title="Foto de tu mascota"
          description="Una buena foto multiplica las posibilidades de reconocerla."
        >
          <div className="space-y-2">
            <Label>
              Fotografías <span className="text-destructive">*</span>
            </Label>
            <PhotoUpload
              value={photos}
              onChange={(next) => {
                setPhotos(next);
                if (next.length >= MIN_PHOTOS) setPhotoError(null);
              }}
              disabled={submitting}
              invalid={Boolean(photoError)}
            />
            {photoError && (
              <p className="text-destructive text-sm font-medium" role="alert">
                {photoError}
              </p>
            )}
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la mascota (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Luna" {...field} />
                </FormControl>
                <FormDescription>
                  El nombre de tu mascota, no el tuyo. Ayuda a encontrar
                  coincidencias con mascotas ya publicadas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FieldGroup>

        {/* ── Datos básicos (requeridos) ── */}
        <FieldGroup title="Datos básicos">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="species"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Especie <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SPECIES_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Estado <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COLOMBIA_DEPARTMENTS.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Bogotá (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Marrón con blanco" {...field} />
                  </FormControl>
                  <FormDescription>
                    Ayuda a encontrar coincidencias con mascotas ya publicadas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FieldGroup>

        {/* ── Contacto ── */}
        <FieldGroup
          title="¿Cómo te contactamos?"
          description="Tu nombre y un medio de contacto para que puedan escribirte."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="reporterName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    Nombre del dueño <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre y apellido" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reporterPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono / WhatsApp</FormLabel>
                  <FormControl>
                    <PhoneField
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Elige el país y escribe el número sin el 0 inicial.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reporterEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      placeholder="tucorreo@ejemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FieldGroup>

        {/* ── Más detalles (opcional) ── */}
        <details className="border-border group rounded-xl border">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 select-none">
            <span className="font-heading text-lg font-semibold">
              Más detalles{" "}
              <span className="text-muted-foreground text-sm font-normal">
                (opcional)
              </span>
            </span>
            <ChevronDown
              className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>

          <div className="space-y-5 p-4 pt-0">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raza</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Mestizo, Labrador…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SEX_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamaño</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SIZE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Temperamento, collar, señas particulares, circunstancias en que se perdió…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="lastSeenLocation"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Última ubicación conocida</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Sector, calle o punto de referencia"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastSeenDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha en que se perdió</FormLabel>
                    <FormControl>
                      <Input type="date" max={todayStr} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </details>

        {submitError && (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-3 rounded-lg border p-4 text-sm"
          >
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <p>{submitError}</p>
          </div>
        )}

        <div className="border-border flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Al enviar, se publicará una ficha pública para ayudar a encontrarla.
          </p>
          <Button
            type="submit"
            size="lg"
            variant="warm"
            disabled={submitting}
            className="sm:w-auto"
          >
            {submitting && <Loader2 className="animate-spin" />}
            {submitting ? "Publicando…" : "Publicar reporte"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function FieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-5">
      <div>
        <legend className="font-heading text-lg font-semibold">{title}</legend>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      {children}
    </fieldset>
  );
}
