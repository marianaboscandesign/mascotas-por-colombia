"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Eye,
  EyeOff,
  HeartHandshake,
  ImageDown,
  Instagram,
  Loader2,
  PencilLine,
  Star,
  Trash2,
} from "lucide-react";

import {
  deletePublication,
  markReunited,
  reclassifyPublication,
  setApproval,
  setFeatured,
  setStatus,
} from "@/app/admin/publicaciones/actions";
import { publishToInstagram } from "@/app/admin/publicaciones/instagram-actions";
import { type AdminPublication } from "@/lib/data/admin-publications";
import { petPhotoUrl, petPhotoThumbUrl } from "@/lib/storage/pet-photos";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS: Record<
  AdminPublication["kind"],
  { value: string; label: string }[]
> = {
  perdida: [
    { value: "activa", label: "Activa" },
    { value: "encontrada", label: "Encontrada" },
    { value: "reunida", label: "Reunida con su familia" },
    { value: "cerrada", label: "Cerrada" },
  ],
  encontrada: [
    { value: "en_resguardo", label: "En resguardo" },
    { value: "en_la_calle", label: "Sola en la calle" },
    { value: "reunida", label: "Reunida" },
    { value: "derivada", label: "Derivada" },
    { value: "cerrada", label: "Cerrada" },
  ],
};

export function PublicationRow({ pub }: { pub: AdminPublication }) {
  const [pending, start] = React.useTransition();
  const title =
    pub.name ?? (pub.kind === "perdida" ? "Sin nombre" : "Sin nombre");
  // Tipo a MOSTRAR: una perdida cuyo estado ya es "encontrada" (apareció) se
  // muestra como Encontrada. Las acciones siguen usando pub.kind (la tabla real).
  const displayKind =
    pub.kind === "perdida" && pub.status === "encontrada"
      ? "encontrada"
      : pub.kind;
  const detailHref =
    pub.kind === "perdida" ? `/mascotas/${pub.id}` : `/found-pets/${pub.id}`;
  const editHref = `/admin/publicaciones/${pub.kind}/${pub.id}`;

  const run = (fn: () => Promise<unknown>) => start(() => void fn());

  // Reclasificar: mover el reporte a la otra sección (perdida ⇄ encontrada)
  // cuando se publicó en la equivocada. Cambia la URL, por eso pedimos confirmar.
  const otherLabel = pub.kind === "perdida" ? "Encontrada" : "Perdida";
  function reclassify() {
    if (
      window.confirm(
        `¿Mover esta mascota a la sección de ${otherLabel}?\n\nSe reclasifica el reporte: pasará a mostrarse (y a publicarse en Instagram) como "${otherLabel}".`,
      )
    ) {
      run(() => reclassifyPublication(pub.kind, pub.id));
    }
  }

  // Publicación en Instagram (semiautomática: el admin confirma cada post).
  const [ig, setIg] = React.useState<{
    loading: boolean;
    msg: string | null;
    ok: boolean;
  }>({ loading: false, msg: null, ok: false });

  async function publishIG() {
    if (
      !window.confirm(
        `¿Publicar esta mascota en Instagram (@mascotasporcolombia)?\n\nSe subirá un post ahora mismo.`,
      )
    ) {
      return;
    }
    setIg({ loading: true, msg: null, ok: false });
    const res = await publishToInstagram(pub.kind, pub.id);
    if (res.success) {
      setIg({ loading: false, ok: true, msg: "¡Publicado en Instagram!" });
    } else {
      setIg({ loading: false, ok: false, msg: res.error });
    }
  }

  return (
    <li className="border-border bg-card rounded-xl border p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg">
          <ImageWithFallback
            src={pub.cover ? petPhotoThumbUrl(pub.cover) : null}
            fallbackSrc={pub.cover ? petPhotoUrl(pub.cover) : undefined}
            alt=""
            sizes="64px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading truncate font-semibold">{title}</h3>
            <Badge variant={displayKind === "perdida" ? "warm" : "default"}>
              {displayKind === "perdida" ? "Perdida" : "Encontrada"}
            </Badge>
            {!pub.isApproved && <Badge variant="warning">Oculta</Badge>}
            {pub.isFeatured && <Badge variant="warning">Urgente</Badge>}
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {pub.city}, {pub.state} · {formatDate(pub.createdAt)}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Select
              value={pub.status}
              onValueChange={(v) => run(() => setStatus(pub.kind, pub.id, v))}
            >
              <SelectTrigger className="h-9 w-auto min-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS[pub.kind].map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {pending && (
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={reclassify}
            >
              <ArrowLeftRight className="size-4" />
              Es {pub.kind === "perdida" ? "encontrada" : "perdida"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => run(() => markReunited(pub.kind, pub.id))}
            >
              <HeartHandshake className="size-4" />
              Reunida
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() =>
                run(() => setFeatured(pub.kind, pub.id, !pub.isFeatured))
              }
            >
              <Star className="size-4" />
              {pub.isFeatured ? "Quitar urgente" : "Destacar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() =>
                run(() => setApproval(pub.kind, pub.id, !pub.isApproved))
              }
            >
              {pub.isApproved ? (
                <>
                  <EyeOff className="size-4" />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye className="size-4" />
                  Aprobar
                </>
              )}
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={editHref}>
                <PencilLine className="size-4" />
                Editar
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={`/api/instagram/${pub.kind}/${pub.id}`} download>
                <ImageDown className="size-4" />
                Imagen IG
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={ig.loading}
              onClick={publishIG}
            >
              {ig.loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Instagram className="size-4" />
              )}
              Publicar en IG
            </Button>
            {ig.msg && (
              <span
                className={`text-xs ${ig.ok ? "text-success" : "text-destructive"}`}
              >
                {ig.msg}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (
                  window.confirm(
                    "¿Eliminar esta publicación? Se ocultará del público.",
                  )
                ) {
                  run(() => deletePublication(pub.kind, pub.id));
                }
              }}
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={detailHref} target="_blank" rel="noopener noreferrer">
                Ver
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
