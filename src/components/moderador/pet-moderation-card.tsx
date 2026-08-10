"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  Instagram,
  Loader2,
  Pencil,
  EyeOff,
  Heart,
  X,
} from "lucide-react";

import {
  moderatorUpdatePet,
  moderatorMarkReunited,
  moderatorHideDuplicate,
  type ModeratorPetInput,
} from "@/app/moderador/actions";
import { publishToInstagram } from "@/app/admin/publicaciones/instagram-actions";
import { type ModeratorPet } from "@/lib/data/moderator-pets";
import { COLOMBIA_DEPARTMENT_VALUES } from "@/lib/validations/shared";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { petThumbFromUrl } from "@/lib/storage/pet-photos";

const STATUS_LABELS: Record<string, string> = {
  activa: "En búsqueda",
  encontrada: "Encontrada",
  cerrada: "Cerrada",
  reunida: "Reunida",
  en_resguardo: "En resguardo",
  en_la_calle: "En la calle",
  derivada: "Derivada",
};

const STATUS_OPTIONS: Record<"perdida" | "encontrada", string[]> = {
  perdida: ["activa", "encontrada", "cerrada", "reunida"],
  encontrada: ["en_resguardo", "en_la_calle", "reunida", "derivada", "cerrada"],
};

export function PetModerationCard({ pet }: { pet: ModeratorPet }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = React.useState(false);
  const [reunitedOpen, setReunitedOpen] = React.useState(false);
  const [hideOpen, setHideOpen] = React.useState(false);
  const [igOpen, setIgOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const title = pet.name ?? "Sin nombre";

  async function run(
    fn: () => Promise<{ success: boolean; error?: string }>,
    okMessage: string,
    close: () => void,
  ) {
    setBusy(true);
    try {
      const res = await fn();
      if (!res.success) {
        toast(res.error ?? "Ocurrió un error.", "error");
        setBusy(false);
        return;
      }
      close();
      setBusy(false);
      toast(okMessage, "success");
      router.refresh();
    } catch {
      toast("Ocurrió un error.", "error");
      setBusy(false);
    }
  }

  return (
    <article className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-4 shadow-sm sm:flex-row">
      <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-xl">
        <ImageWithFallback
          src={petThumbFromUrl(pet.cover)}
          fallbackSrc={pet.cover}
          alt={title}
          sizes="96px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading font-semibold">{title}</h3>
          <Badge variant={pet.kind === "perdida" ? "warm" : "secondary"}>
            {pet.kind === "perdida" ? "Perdida" : "Encontrada"}
          </Badge>
          <Badge variant={pet.status === "reunida" ? "success" : "outline"}>
            {STATUS_LABELS[pet.status] ?? pet.status}
          </Badge>
          {!pet.isApproved && <Badge variant="warning">Oculta</Badge>}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {[pet.city, pet.state].filter(Boolean).join(", ") || "Sin ubicación"}
          {pet.phone ? ` · ${pet.phone}` : ""}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Editar
          </Button>
          {pet.status !== "reunida" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReunitedOpen(true)}
            >
              <Heart className="size-4" />
              Marcar como reunida
            </Button>
          )}
          {pet.isApproved && (
            <Button variant="ghost" size="sm" onClick={() => setHideOpen(true)}>
              <EyeOff className="size-4" />
              Ocultar duplicado
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setIgOpen(true)}>
            <Instagram className="size-4" />
            Publicar en IG
          </Button>
        </div>
      </div>

      {/* Modal: Editar */}
      <EditDialog
        pet={pet}
        open={editOpen}
        onOpenChange={setEditOpen}
        busy={busy}
        onSubmit={(values) =>
          run(
            () => moderatorUpdatePet(pet.kind, pet.id, values),
            "Información actualizada.",
            () => setEditOpen(false),
          )
        }
      />

      {/* Modal: Confirmar reunida */}
      <ConfirmDialog
        open={reunitedOpen}
        onOpenChange={setReunitedOpen}
        busy={busy}
        title="Marcar como reunida"
        description="¿Confirmas que esta mascota ya fue reunida con su familia? Esta acción actualizará la publicación."
        confirmLabel="Confirmar"
        onConfirm={() =>
          run(
            () => moderatorMarkReunited(pet.kind, pet.id),
            "Mascota marcada como reunida.",
            () => setReunitedOpen(false),
          )
        }
      />

      {/* Modal: Ocultar duplicado */}
      <ConfirmDialog
        open={hideOpen}
        onOpenChange={setHideOpen}
        busy={busy}
        title="Ocultar duplicado"
        description="Se ocultará esta publicación por estar duplicada. No se elimina: un administrador puede volver a mostrarla."
        confirmLabel="Ocultar"
        onConfirm={() =>
          run(
            () => moderatorHideDuplicate(pet.kind, pet.id),
            "Publicación ocultada.",
            () => setHideOpen(false),
          )
        }
      />

      {/* Modal: Publicar en Instagram */}
      <ConfirmDialog
        open={igOpen}
        onOpenChange={setIgOpen}
        busy={busy}
        title="Publicar en Instagram"
        description="Se subirá esta mascota como publicación en @mascotasporcolombia, con la imagen y un texto automáticos. ¿Publicar ahora?"
        confirmLabel="Publicar"
        onConfirm={() =>
          run(
            () => publishToInstagram(pet.kind, pet.id),
            "¡Publicado en Instagram!",
            () => setIgOpen(false),
          )
        }
      />
    </article>
  );
}

function EditDialog({
  pet,
  open,
  onOpenChange,
  busy,
  onSubmit,
}: {
  pet: ModeratorPet;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  busy: boolean;
  onSubmit: (values: ModeratorPetInput) => void;
}) {
  const [v, setV] = React.useState<ModeratorPetInput>({});

  React.useEffect(() => {
    if (open) {
      setV({
        name: pet.name ?? "",
        description: pet.description ?? "",
        color: pet.color ?? "",
        city: pet.city ?? "",
        location: pet.location ?? "",
        state: pet.state ?? "",
        phone: pet.phone ?? "",
        status: pet.status,
      });
    }
  }, [open, pet]);

  function set<K extends keyof ModeratorPetInput>(
    k: K,
    val: ModeratorPetInput[K],
  ) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  return (
    <ModalShell open={open} onOpenChange={onOpenChange} title="Editar mascota">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldEl label="Nombre">
            <Input
              value={v.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
            />
          </FieldEl>
          <FieldEl label="Teléfono / WhatsApp">
            <Input
              value={v.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
            />
          </FieldEl>
          <FieldEl label="Color">
            <Input
              value={v.color ?? ""}
              onChange={(e) => set("color", e.target.value)}
            />
          </FieldEl>
          <FieldEl label="Estado (publicación)">
            <select
              value={v.status ?? ""}
              onChange={(e) => set("status", e.target.value)}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              {STATUS_OPTIONS[pet.kind].map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] ?? s}
                </option>
              ))}
            </select>
          </FieldEl>
          <FieldEl label="Ciudad">
            <Input
              value={v.city ?? ""}
              onChange={(e) => set("city", e.target.value)}
            />
          </FieldEl>
          <FieldEl label="Departamento">
            <select
              value={v.state ?? ""}
              onChange={(e) => set("state", e.target.value)}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Sin especificar</option>
              {COLOMBIA_DEPARTMENT_VALUES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FieldEl>
        </div>
        <FieldEl label="Ubicación (sector / dirección)">
          <Input
            value={v.location ?? ""}
            onChange={(e) => set("location", e.target.value)}
          />
        </FieldEl>
        <FieldEl label="Descripción / observaciones">
          <Textarea
            rows={3}
            value={v.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </FieldEl>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={() => onSubmit(v)} disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          Guardar
        </Button>
      </div>
    </ModalShell>
  );
}

function ConfirmDialog({
  open,
  onOpenChange,
  busy,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  busy: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <ModalShell open={open} onOpenChange={onOpenChange} title={title}>
      <div className="flex items-start gap-3">
        <span className="bg-warm/15 text-warm grid size-9 shrink-0 place-items-center rounded-lg">
          <AlertCircle className="size-5" aria-hidden="true" />
        </span>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button variant="warm" onClick={onConfirm} disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {confirmLabel}
        </Button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in fixed inset-0 z-50 backdrop-blur-sm" />
        <Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-heading text-lg font-semibold">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Cerrar">
                <X />
              </Button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FieldEl({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
