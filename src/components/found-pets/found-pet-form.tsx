"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, Check, ChevronDown, Loader2, MapPin } from "lucide-react";

import {
  foundPetFieldsSchema,
  type FoundPetFormValues,
} from "@/lib/validations/found-pet";
import {
  HEALTH_STATUS_OPTIONS,
  MAX_FOUND_PHOTOS,
  SEX_OPTIONS,
  SIZE_OPTIONS,
  SPECIES_OPTIONS,
} from "@/lib/constants/pets";
import { COLOMBIA_DEPARTMENTS } from "@/lib/constants/colombia";
import { isSupabaseConfigured } from "@/lib/env";
import { compressImage } from "@/lib/images/compress";
import {
  removePetPhotos,
  removePetVideo,
  uploadPetPhotos,
  uploadPetVideo,
} from "@/lib/storage/pet-photos";
import { createFoundPet } from "@/app/found-pets/reportar/actions";
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
import { VideoUpload } from "@/components/media/video-upload";
import { AiAutofillCard } from "@/components/ai/ai-autofill-card";
import { AiAutofillModal } from "@/components/ai/ai-autofill-modal";

const todayStr = new Date().toISOString().slice(0, 10);

interface Coords {
  latitude: number;
  longitude: number;
}

export function FoundPetForm() {
  const router = useRouter();
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [video, setVideo] = React.useState<File | null>(null);
  const [coords, setCoords] = React.useState<Coords | null>(null);
  const [photoError, setPhotoError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [aiModalOpen, setAiModalOpen] = React.useState(false);

  const form = useForm<FoundPetFormValues>({
    resolver: zodResolver(foundPetFieldsSchema),
    defaultValues: {
      species: undefined,
      status: "en_resguardo",
      breed: "",
      sex: "desconocido",
      color: "",
      size: "mediano",
      foundDate: "",
      state: undefined,
      city: "",
      address: "",
      healthStatus: "",
      description: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
    },
  });

  function handleAiData(data: Partial<FoundPetFormValues>, images?: File[]) {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.setValue(key as keyof FoundPetFormValues, value as any, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    });

    if (images && images.length > 0) {
      setPhotos((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const filtered = images.filter((f) => !existingNames.has(f.name));
        return [...prev, ...filtered].slice(0, MAX_FOUND_PHOTOS); // Máximo permitido para encontradas
      });
      setPhotoError(null);
    }
  }

  async function onSubmit(values: FoundPetFormValues) {
    setSubmitError(null);
    setPhotoError(null);

    if (photos.length < 1) {
      setPhotoError("Sube al menos una foto de la mascota.");
      return;
    }
    if (!isSupabaseConfigured) {
      setSubmitError(
        "Supabase aún no está configurado. Completa las variables de entorno para enviar el reporte.",
      );
      return;
    }

    setSubmitting(true);
    let uploadedPhotos: string[] = [];
    let uploadedVideo: string | null = null;
    try {
      const optimized = await Promise.all(
        photos.map((file) => compressImage(file)),
      );
      uploadedPhotos = await uploadPetPhotos(optimized, "found");
      if (video) uploadedVideo = await uploadPetVideo(video);

      const result = await createFoundPet({
        ...values,
        photos: uploadedPhotos,
        videoPath: uploadedVideo ?? undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });

      if (!result.success) {
        await removePetPhotos(uploadedPhotos);
        await removePetVideo(uploadedVideo);
        setSubmitError(result.error);
        setSubmitting(false);
        return;
      }

      router.push(`/found-pets/${result.data.id}?nuevo=1`);
    } catch (error) {
      await removePetPhotos(uploadedPhotos);
      await removePetVideo(uploadedVideo);
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
          <strong>especie</strong>, el <strong>departamento</strong> y{" "}
          <strong>un medio de contacto</strong>. Lo demás es opcional, pero cada
          dato ayuda a reunirla con su familia.
        </p>

        <AiAutofillCard
          onClick={() => setAiModalOpen(true)}
          entityName="mascota"
        />
        <AiAutofillModal
          isOpen={aiModalOpen}
          onOpenChange={setAiModalOpen}
          entityType="found-pet"
          onDataExtracted={handleAiData}
        />

        {/* ── Fotos y video ── */}
        <FieldGroup
          title="Foto de la mascota"
          description="Ayuda a que su familia la reconozca. La foto es obligatoria; el video es opcional."
        >
          <div className="space-y-2">
            <Label>
              Fotografías <span className="text-destructive">*</span>
            </Label>
            <PhotoUpload
              value={photos}
              maxPhotos={MAX_FOUND_PHOTOS}
              onChange={(next) => {
                setPhotos(next);
                if (next.length >= 1) setPhotoError(null);
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

          <div className="space-y-2">
            <Label>Video corto</Label>
            <VideoUpload
              value={video}
              onChange={setVideo}
              disabled={submitting}
            />
          </div>
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    ¿Cómo está la mascota?{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en_resguardo">
                        En resguardo (la tengo a salvo)
                      </SelectItem>
                      <SelectItem value="en_la_calle">
                        Sola en la calle
                      </SelectItem>
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
                    Departamento <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el departamento" />
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
                    <Input placeholder="Ej. Valencia (opcional)" {...field} />
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
                    <Input placeholder="Ej. Negro con blanco" {...field} />
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
              name="contactName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    Tu nombre <span className="text-destructive">*</span>
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
              name="contactPhone"
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
              name="contactEmail"
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
                      <Input placeholder="Opcional" {...field} />
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

              <FormField
                control={form.control}
                name="healthStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado de salud</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="¿Cómo la viste?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {HEALTH_STATUS_OPTIONS.map((o) => (
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
                      placeholder="Señas particulares, collar, comportamiento, en qué circunstancias la encontraste…"
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
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Dirección aproximada</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Sector, avenida o punto de referencia"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foundDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha del avistamiento</FormLabel>
                    <FormControl>
                      <Input type="date" max={todayStr} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Coordenadas GPS</Label>
                <LocationField value={coords} onChange={setCoords} />
              </div>
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
            Al enviar, se publicará una ficha pública para ayudar a reunirla con
            su familia.
          </p>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            {submitting ? "Publicando…" : "Publicar reporte"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function LocationField({
  value,
  onChange,
}: {
  value: Coords | null;
  onChange: (coords: Coords | null) => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function capture() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Tu navegador no permite compartir la ubicación.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        });
        setLoading(false);
      },
      () => {
        setError("No pudimos obtener tu ubicación. Revisa los permisos.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (value) {
    return (
      <div className="border-border bg-secondary/40 flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
        <span className="text-success flex items-center gap-2">
          <Check className="size-4" />
          {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-muted-foreground hover:text-foreground text-xs underline"
        >
          Quitar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        onClick={capture}
        disabled={loading}
      >
        <MapPin className="size-4" />
        {loading ? "Obteniendo ubicación…" : "Usar mi ubicación actual"}
      </Button>
      {error ? (
        <p className="text-warning text-xs">{error}</p>
      ) : (
        <p className="text-muted-foreground text-xs">
          Opcional. Mejora la precisión del punto donde la viste.
        </p>
      )}
    </div>
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
