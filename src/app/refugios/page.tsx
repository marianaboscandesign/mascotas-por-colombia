import type { Metadata } from "next";
import Link from "next/link";
import { Home, PlusCircle } from "lucide-react";

import { getShelters, type ShelterKindFilter } from "@/lib/data/shelters";
import { SHELTER_NEEDS, SHELTER_NEED_VALUES } from "@/lib/constants/shelters";
import { routes } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { type ShelterNeedEnum } from "@/types/database";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { ShelterCard } from "@/components/shelters/shelter-card";

export const metadata: Metadata = {
  alternates: { canonical: "/refugios" },
  title: "Centros de Acopio y Refugios",
  description:
    "Directorio de refugios y fundaciones con centros de acopio para las mascotas de Colombia. Conoce qué necesitan y cómo ayudarlos.",
};

interface PageProps {
  searchParams: Promise<{ necesidad?: string; tipo?: string }>;
}

function parseNeed(v?: string): ShelterNeedEnum | undefined {
  return v && (SHELTER_NEED_VALUES as string[]).includes(v)
    ? (v as ShelterNeedEnum)
    : undefined;
}

function parseKind(v?: string): ShelterKindFilter | undefined {
  return v === "refugio" || v === "centro_acopio" ? v : undefined;
}

const KIND_TABS: { label: string; value?: ShelterKindFilter }[] = [
  { label: "Todos" },
  { label: "Refugios", value: "refugio" },
  { label: "Centros de acopio", value: "centro_acopio" },
];

/** Construye un href conservando los filtros activos. */
function filterHref(params: { tipo?: string; necesidad?: string }): string {
  const qs = new URLSearchParams();
  if (params.tipo) qs.set("tipo", params.tipo);
  if (params.necesidad) qs.set("necesidad", params.necesidad);
  const s = qs.toString();
  return s ? `/refugios?${s}` : "/refugios";
}

export default async function SheltersPage({ searchParams }: PageProps) {
  const { necesidad, tipo } = await searchParams;
  const need = parseNeed(necesidad);
  const kind = parseKind(tipo);
  const shelters = await getShelters({ need, kind });

  return (
    <>
      <PageHeader
        eyebrow="Cómo ayudar"
        title="Centros de Acopio y Refugios"
        description="Refugios y fundaciones con centros de acopio —en Colombia y en otros países— para ayudar a las mascotas. Mira qué donaciones necesitan y dónde llevarlas."
      />
      <Container className="py-10 lg:py-14">
        {/* CTA: registrar centro de acopio */}
        <div className="border-warm/30 bg-warm-soft/40 mb-8 flex flex-col items-start gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <span className="font-medium">
              ¿Tienes un centro de acopio o refugio?
            </span>{" "}
            Regístralo gratis y publica qué necesitas para las mascotas.
          </p>
          <Button asChild variant="warm" size="sm">
            <Link href={routes.shelterRegister}>
              <PlusCircle aria-hidden="true" />
              Registrar mi centro de acopio
            </Link>
          </Button>
        </div>

        {/* Filtro por tipo */}
        <div className="mb-4 flex flex-wrap gap-2">
          {KIND_TABS.map((t) => (
            <FilterChip
              key={t.label}
              label={t.label}
              href={filterHref({ tipo: t.value, necesidad })}
              active={kind === t.value}
            />
          ))}
        </div>

        {/* Filtro por necesidad */}
        <div className="mb-8 flex flex-wrap gap-2">
          <FilterChip
            label="Todas las necesidades"
            href={filterHref({ tipo })}
            active={!need}
          />
          {SHELTER_NEEDS.map((n) => (
            <FilterChip
              key={n.value}
              label={n.label}
              href={filterHref({ tipo, necesidad: n.value })}
              active={need === n.value}
            />
          ))}
        </div>

        {shelters.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shelters.map((shelter) => (
              <li key={shelter.id}>
                <ShelterCard shelter={shelter} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
            <span className="bg-secondary text-primary grid size-14 place-items-center rounded-2xl">
              <Home className="size-6" aria-hidden="true" />
            </span>
            <h2 className="font-heading mt-6 text-xl font-semibold">
              {need
                ? "Ningún refugio con esa necesidad"
                : "Aún no hay refugios"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {need
                ? "Prueba con otra necesidad o mira todos los refugios."
                : "Pronto aparecerán aquí los refugios verificados."}
            </p>
          </div>
        )}
      </Container>
    </>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "focus-visible:ring-ring rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
