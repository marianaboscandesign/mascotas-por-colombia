"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import {
  volunteerSchemaWithConsent,
  type VolunteerFormValues,
} from "@/lib/validations/volunteer";
import { VOLUNTEER_ROLES } from "@/lib/constants/volunteers";
import { COLOMBIA_DEPARTMENTS } from "@/lib/constants/colombia";
import { createVolunteer } from "@/app/voluntarios/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { AiAutofillCard } from "@/components/ai/ai-autofill-card";
import { AiAutofillModal } from "@/components/ai/ai-autofill-modal";

export function VolunteerForm() {
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [aiModalOpen, setAiModalOpen] = React.useState(false);

  const form = useForm<VolunteerFormValues>({
    resolver: zodResolver(volunteerSchemaWithConsent),
    defaultValues: {
      fullName: "",
      state: undefined,
      city: "",
      phone: "",
      whatsapp: "",
      email: "",
      profession: "",
      availability: "",
      comments: "",
      roles: [],
      publicContact: [],
    },
  });

  const roles = form.watch("roles") ?? [];
  const rolesError = form.formState.errors.roles?.message;
  const publicContact = form.watch("publicContact") ?? [];

  function toggleRole(value: string) {
    const next = roles.includes(value)
      ? roles.filter((r) => r !== value)
      : [...roles, value];
    form.setValue("roles", next, { shouldValidate: true });
  }

  function togglePublicContact(value: "email" | "phone" | "whatsapp") {
    const next = publicContact.includes(value)
      ? publicContact.filter((c) => c !== value)
      : [...publicContact, value];
    form.setValue("publicContact", next, { shouldValidate: true });
  }

  function handleAiData(data: Partial<VolunteerFormValues>) {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        if (key === "roles") {
          // ensure roles is an array
          form.setValue("roles", Array.isArray(value) ? value : [value], { shouldValidate: true });
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          form.setValue(key as keyof VolunteerFormValues, value as any, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    });
  }

  async function onSubmit(values: VolunteerFormValues) {
    setSubmitError(null);
    setSubmitting(true);
    const result = await createVolunteer(values);
    if (!result.success) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="border-success/30 bg-success/10 flex flex-col items-center rounded-2xl border p-8 text-center">
        <span className="bg-success/15 text-success grid size-14 place-items-center rounded-full">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="font-heading mt-5 text-xl font-semibold">
          ¡Gracias por sumarte!
        </h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          ¡Listo! Ya formas parte de la red. Si aceptaste mostrar tu contacto,
          ya apareces en el directorio público para que los refugios puedan
          escribirte.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-10"
        noValidate
      >
        <AiAutofillCard onClick={() => setAiModalOpen(true)} entityName="voluntario" />
        <AiAutofillModal
          isOpen={aiModalOpen}
          onOpenChange={setAiModalOpen}
          entityType="volunteer"
          onDataExtracted={handleAiData}
        />

        {/* Roles */}
        <fieldset className="space-y-3">
          <legend className="font-heading text-lg font-semibold">
            ¿Cómo quieres ayudar?
          </legend>
          <p className="text-muted-foreground text-sm">
            Selecciona uno o más roles.
          </p>
          <div className="flex flex-wrap gap-2">
            {VOLUNTEER_ROLES.map((role) => {
              const active = roles.includes(role.value);
              return (
                <button
                  key={role.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleRole(role.value)}
                  className={cn(
                    "focus-visible:ring-ring rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {role.label}
                </button>
              );
            })}
          </div>
          {rolesError && (
            <p className="text-destructive text-sm font-medium" role="alert">
              {rolesError}
            </p>
          )}
        </fieldset>

        {/* Datos personales */}
        <fieldset className="space-y-5">
          <legend className="font-heading text-lg font-semibold">
            Tus datos
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    Nombre <span className="text-destructive">*</span>
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
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Estado <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COLOMBIA_DEPARTMENTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
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
                  <FormLabel>
                    Ciudad <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Bogotá" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profession"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Profesión <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Médico veterinario" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Correo electrónico{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
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

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      placeholder="+57 300 0000000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      placeholder="0412 0000000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Colombia: con 0 (0414, 0424…). Otros países: con + y código
                    (ej. +1 305…).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    Disponibilidad <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Fines de semana, tardes entre semana…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Comentarios</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Cuéntanos cualquier detalle que debamos saber (opcional)."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        {/* Directorio público */}
        <fieldset className="border-border bg-muted/30 space-y-3 rounded-2xl border p-5">
          <legend className="font-heading px-1 text-lg font-semibold">
            Aparecer en el directorio
          </legend>
          <p className="text-muted-foreground text-sm">
            Cuando un administrador active tu registro, aparecerás en el
            directorio público para que refugios y fundaciones te contacten.
            Elige qué datos de contacto aceptas mostrar (se mostrarán solo
            esos). Si no eliges ninguno, no aparecerás en el directorio.
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "email", label: "Correo" },
                { value: "whatsapp", label: "WhatsApp" },
                { value: "phone", label: "Teléfono" },
              ] as const
            ).map((c) => {
              const active = publicContact.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => togglePublicContact(c.value)}
                  className={cn(
                    "focus-visible:ring-ring rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          {form.formState.errors.phone?.message && (
            <p className="text-destructive text-sm font-medium" role="alert">
              {form.formState.errors.phone.message}
            </p>
          )}
          {form.formState.errors.whatsapp?.message && (
            <p className="text-destructive text-sm font-medium" role="alert">
              {form.formState.errors.whatsapp.message}
            </p>
          )}
        </fieldset>

        {submitError && (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-3 rounded-lg border p-4 text-sm"
          >
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <p>{submitError}</p>
          </div>
        )}

        <div className="border-border flex justify-end border-t pt-6">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            {submitting ? "Enviando…" : "Registrarme como voluntario"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
