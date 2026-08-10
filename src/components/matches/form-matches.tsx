"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";

import {
  fetchReportMatches,
  type ReportMatchInput,
} from "@/app/reportar/match-action";
import { type MatchResult } from "@/lib/data/matches";
import { petThumbFromUrl } from "@/lib/storage/pet-photos";
import { formatDate } from "@/lib/utils";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

interface FormMatchesProps extends ReportMatchInput {
  formKind: "perdida" | "encontrada";
}

/**
 * Sugerencias EN VIVO dentro del formulario de reporte. Conforme la persona
 * llena especie/estado/color, muestra mascotas parecidas ya publicadas para
 * que las revise antes de publicar (hallar a la mascota / evitar duplicados).
 */
export function FormMatches({ formKind, ...attrs }: FormMatchesProps) {
  const [data, setData] = React.useState<{
    reunion: MatchResult[];
    duplicates: MatchResult[];
  }>({ reunion: [], duplicates: [] });

  const { species, state, city, color, sex, size, breed, name, date } = attrs;

  React.useEffect(() => {
    if (!species) {
      setData({ reunion: [], duplicates: [] });
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetchReportMatches(formKind, {
          species,
          state,
          city,
          color,
          sex,
          size,
          breed,
          name,
          date,
        });
        if (active) setData(res);
      } catch {
        if (active) setData({ reunion: [], duplicates: [] });
      }
    }, 600);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [formKind, species, state, city, color, sex, size, breed, name, date]);

  const hasAny = data.reunion.length > 0 || data.duplicates.length > 0;
  if (!hasAny) return null;

  const reunionTitle =
    formKind === "perdida"
      ? "¿Alguna de estas es tu mascota?"
      : "¿Reconoces a su familia?";
  const reunionDesc =
    formKind === "perdida"
      ? "Estas mascotas encontradas se parecen a la tuya. Revísalas: quizá ya está a salvo."
      : "Estos reportes de mascotas perdidas se parecen. Quizá su familia ya la está buscando.";

  return (
    <div className="space-y-4">
      {data.reunion.length > 0 && (
        <MatchPanel
          tone="reunion"
          icon={<Sparkles className="size-5" aria-hidden="true" />}
          title={reunionTitle}
          description={reunionDesc}
          matches={data.reunion}
        />
      )}
      {data.duplicates.length > 0 && (
        <MatchPanel
          tone="duplicate"
          icon={<Search className="size-5" aria-hidden="true" />}
          title="¿Tu mascota ya está publicada?"
          description="Encontramos reportes parecidos. Revísalos para no duplicar la publicación."
          matches={data.duplicates}
        />
      )}
    </div>
  );
}

function MatchPanel({
  tone,
  icon,
  title,
  description,
  matches,
}: {
  tone: "reunion" | "duplicate";
  icon: React.ReactNode;
  title: string;
  description: string;
  matches: MatchResult[];
}) {
  const accent =
    tone === "reunion"
      ? "border-warm/30 bg-warm-soft/40"
      : "border-border bg-muted/40";
  const badge =
    tone === "reunion"
      ? "bg-warm/15 text-warm"
      : "bg-secondary text-secondary-foreground";

  return (
    <section className={`rounded-2xl border p-5 ${accent}`}>
      <div className="flex items-center gap-2">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-lg ${badge}`}
        >
          {icon}
        </span>
        <div>
          <h3 className="font-heading text-base font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {matches.map((m) => (
          <li key={`${m.kind}-${m.id}`}>
            <Link
              href={m.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group focus-visible:ring-ring border-border bg-card flex gap-3 rounded-xl border p-3 shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg">
                <ImageWithFallback
                  src={petThumbFromUrl(m.photo)}
                  fallbackSrc={m.photo}
                  alt={m.title}
                  sizes="64px"
                  className="object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="bg-success/15 text-success inline-block rounded-full px-2 py-0.5 text-xs font-semibold">
                  {m.score}% de similitud
                </span>
                <p className="font-heading mt-1 truncate text-sm font-semibold">
                  {m.title}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {m.city}
                  {m.date ? ` · ${formatDate(m.date)}` : ""}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
