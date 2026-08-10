"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import {
  contactSchema,
  type ContactFormValues,
} from "@/lib/validations/contact";
import { sendContactMessage } from "@/app/contacto/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneField } from "@/components/common/phone-field";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function ContactForm() {
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: ContactFormValues) {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await sendContactMessage(values);
      if (!result.success) {
        setSubmitError(result.error);
        setSubmitting(false);
        return;
      }
      setSent(true);
    } catch {
      setSubmitError("Ocurrió un error al enviar. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="border-success/30 bg-success/5 flex flex-col items-center gap-3 rounded-2xl border p-8 text-center">
        <span className="bg-success/15 text-success grid size-12 place-items-center rounded-full">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </span>
        <h2 className="font-heading text-xl font-semibold">
          ¡Mensaje enviado!
        </h2>
        <p className="text-muted-foreground max-w-md text-sm">
          Gracias por escribirnos. Te responderemos lo antes posible al contacto
          que dejaste.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Teléfono / WhatsApp{" "}
                  <span className="text-destructive">*</span>
                </FormLabel>
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico (opcional)</FormLabel>
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
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asunto (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="¿Sobre qué nos escribes?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Mensaje <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Cuéntanos en qué podemos ayudarte…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError && (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-3 rounded-lg border p-4 text-sm"
          >
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <p>{submitError}</p>
          </div>
        )}

        <Button type="submit" size="lg" variant="warm" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          {submitting ? "Enviando…" : "Enviar mensaje"}
        </Button>
      </form>
    </Form>
  );
}
