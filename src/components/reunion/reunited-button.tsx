"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, Heart, Loader2, X } from "lucide-react";

import { selfReportReunited } from "@/lib/actions/reunion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  kind: "perdida" | "encontrada";
  id: string;
  petName: string;
}

export function ReunitedButton({ kind, id, petName }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    if (!confirmed) return;
    setSubmitting(true);
    setError(null);
    const result = await selfReportReunited(kind, id, message);
    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    setOpen(false);
    router.push(`/success-stories/${id}`);
    router.refresh();
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className="bg-success text-success-foreground hover:bg-success/90 w-full justify-center sm:w-auto">
          <Heart className="size-4" aria-hidden="true" />
          Mi mascota ya apareció
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in fixed inset-0 z-50 backdrop-blur-sm" />
        <Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 shadow-xl focus:outline-none">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="font-heading text-xl font-bold">
              ¡Qué alegría! 🎉
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Cerrar">
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-muted-foreground mt-2 text-sm">
            Confirma que <strong className="text-foreground">{petName}</strong>{" "}
            ya está de nuevo con su familia. La publicación pasará a{" "}
            <strong className="text-foreground">
              Historias de Reencuentro
            </strong>
            , conservando sus fotos. No se eliminará.
          </Dialog.Description>

          <div className="mt-5 space-y-2">
            <Label htmlFor="reunion-message">
              Comparte tu mensaje de reencuentro (opcional)
            </Label>
            <Textarea
              id="reunion-message"
              rows={3}
              maxLength={1000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="¿Cómo fue el reencuentro? Tu historia puede dar esperanza a otros."
            />
          </div>

          <label className="mt-4 flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="border-input accent-primary mt-0.5 size-4 rounded"
            />
            <span>
              Confirmo que esta mascota ya está sana y salva con su familia.
            </span>
          </label>

          {error && (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/5 text-destructive mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <Button variant="ghost">Cancelar</Button>
            </Dialog.Close>
            <Button
              onClick={submit}
              disabled={!confirmed || submitting}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {submitting && <Loader2 className="animate-spin" />}
              {submitting ? "Confirmando…" : "Sí, ¡ya apareció!"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
