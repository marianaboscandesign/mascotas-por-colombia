"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import {
  deleteVolunteer,
  setVolunteerPublicContact,
  setVolunteerStatus,
} from "@/app/admin/voluntarios/actions";
import { type VolunteerStatusEnum } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ContactChannel = "email" | "phone" | "whatsapp";

const CHANNEL_LABELS: Record<ContactChannel, string> = {
  email: "Correo",
  whatsapp: "WhatsApp",
  phone: "Teléfono",
};

export function VolunteerControls({
  id,
  status,
  available,
  publicContact,
}: {
  id: string;
  status: VolunteerStatusEnum;
  /** Canales con un valor cargado (los únicos que se pueden publicar). */
  available: ContactChannel[];
  /** Canales que se muestran actualmente en el directorio. */
  publicContact: string[];
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  function toggleChannel(channel: ContactChannel) {
    const next = publicContact.includes(channel)
      ? publicContact.filter((c) => c !== channel)
      : [...publicContact, channel];
    start(async () => {
      await setVolunteerPublicContact(id, next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <Select
          value={status}
          onValueChange={(v) =>
            start(async () => {
              await setVolunteerStatus(id, v);
              router.refresh();
            })
          }
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="inactivo">Inactivo</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          disabled={pending}
          aria-label="Eliminar voluntario"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            if (window.confirm("¿Eliminar este voluntario del directorio?")) {
              start(async () => {
                await deleteVolunteer(id);
                router.refresh();
              });
            }
          }}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>
      </div>

      {available.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <span className="text-muted-foreground mr-0.5 text-xs">Mostrar:</span>
          {available.map((channel) => {
            const active = publicContact.includes(channel);
            return (
              <button
                key={channel}
                type="button"
                aria-pressed={active}
                disabled={pending}
                onClick={() => toggleChannel(channel)}
                className={cn(
                  "focus-visible:ring-ring rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none disabled:opacity-50",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50",
                )}
              >
                {CHANNEL_LABELS[channel]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
