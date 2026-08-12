"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2, Trash2 } from "lucide-react";

import { resolveExternalImport } from "@/app/admin/importaciones/actions";
import { type ExternalPetReview } from "@/lib/data/external-pet-imports";
import { petPhotoThumbUrl } from "@/lib/storage/pet-photos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

export function ExternalImportRow({ report }: { report: ExternalPetReview }) {
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const decide = (decision: "duplicada" | "descartada" | "publicar") => {
    setError(null);
    start(async () => {
      const result = await resolveExternalImport(report.id, decision);
      if (!result.success) setError(result.error ?? "No se pudo guardar la decisión.");
    });
  };

  return (
    <li className="border-border bg-card rounded-xl border p-4 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant={report.kind === "perdida" ? "warm" : "default"}>
              Fuente externa · {report.kind === "perdida" ? "Perdida" : "Encontrada"}
            </Badge>
            <span className="text-muted-foreground text-xs">{report.source}</span>
          </div>
          <div className="flex gap-3">
            <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-lg">
              <ImageWithFallback src={report.photoUrl} alt="Mascota reportada externamente" className="size-full object-cover" />
            </div>
            <div className="min-w-0">
              <h2 className="font-heading font-semibold">{report.name ?? `Mascota ${report.species}`}</h2>
              <p className="text-muted-foreground text-sm">{[report.sector, report.city].filter(Boolean).join(", ") || "Ubicación sin confirmar"}</p>
              <p className="text-muted-foreground mt-2 line-clamp-4 text-sm">{report.description}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={report.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Ver fuente</a>
            </Button>
            {report.contactUrl && (
              <Button asChild size="sm" variant="outline">
                <a href={report.contactUrl} target="_blank" rel="noreferrer">Abrir WhatsApp</a>
              </Button>
            )}
          </div>
        </section>

        <section className="border-border border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
          <h3 className="font-heading text-sm font-semibold">Posibles duplicados</h3>
          <ul className="mt-3 space-y-3">
            {report.candidates.map((candidate) => {
              const href = candidate.kind === "perdida" ? `/mascotas/${candidate.id}` : `/found-pets/${candidate.id}`;
              return (
                <li key={`${candidate.kind}-${candidate.id}`} className="bg-muted/35 flex gap-3 rounded-lg p-3">
                  <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-md">
                    <ImageWithFallback src={candidate.photo ? petPhotoThumbUrl(candidate.photo) : null} alt="" className="size-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><strong className="truncate text-sm">{candidate.name ?? "Sin nombre"}</strong><Badge variant="warning">{Math.round(candidate.score)}%</Badge></div>
                    <p className="text-muted-foreground mt-0.5 text-xs">{candidate.city ?? "Sin ciudad"} · {candidate.reasons.join(", ")}</p>
                    <Link href={href} target="_blank" className="text-primary mt-1 inline-block text-xs underline">Ver reporte interno</Link>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" disabled={pending} onClick={() => decide("duplicada")}><Check className="size-4" />Marcar duplicada</Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => decide("publicar")}>Publicar como nueva</Button>
            <Button size="sm" variant="ghost" disabled={pending} className="text-destructive" onClick={() => decide("descartada")}><Trash2 className="size-4" />Descartar</Button>
            {pending && <Loader2 className="text-muted-foreground size-4 animate-spin self-center" />}
          </div>
          {error && <p className="text-destructive mt-3 text-sm">{error}</p>}
        </section>
      </div>
    </li>
  );
}
