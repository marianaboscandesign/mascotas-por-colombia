import type { Metadata } from "next";
import Link from "next/link";
import { PawPrint } from "lucide-react";

import { getFoundPets, type FoundPetFilters } from "@/lib/data/found-pets";
import { SPECIES_OPTIONS } from "@/lib/constants/pets";
import { COLOMBIA_DEPARTMENTS, stateToSlug } from "@/lib/constants/colombia";
import { type PetSpeciesEnum } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";
import { FoundPetCard } from "@/components/found-pets/found-pet-card";
import { FoundPetsFilters } from "@/components/found-pets/found-pets-filters";
import { Pagination } from "@/components/common/pagination";
import { SocialPetsSection } from "@/components/social/social-pets-section";

export const metadata: Metadata = {
  alternates: { canonical: "/found-pets" },
  title: "Mascotas encontradas en Colombia | ¿Reconoces a alguna?",
  description:
    "Mascotas encontradas y rescatadas en Colombia. Revisa si alguna es tuya buscando por ciudad, especie y color, o reporta una mascota que encontraste.",
};

interface PageProps {
  searchParams: Promise<{
    city?: string;
    species?: string;
    color?: string;
    page?: string;
  }>;
}

const SPECIES_VALUES = SPECIES_OPTIONS.map((o) => o.value);

function parseSpecies(value?: string): PetSpeciesEnum | undefined {
  return value && (SPECIES_VALUES as string[]).includes(value)
    ? (value as PetSpeciesEnum)
    : undefined;
}

export default async function FoundPetsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 12;

  const filters: FoundPetFilters = {
    city: sp.city?.trim() || undefined,
    color: sp.color?.trim() || undefined,
    species: parseSpecies(sp.species),
    page,
    pageSize,
  };

  const { items: pets, total } = await getFoundPets(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(filters.city || filters.color || filters.species);

  // Parámetros de búsqueda para preservar filtros al paginar
  const baseParams: Record<string, string> = {};
  if (filters.city) baseParams.city = filters.city;
  if (filters.color) baseParams.color = filters.color;
  if (filters.species) baseParams.species = filters.species;

  return (
    <>
      <PageHeader
        eyebrow="Directorio"
        title="Mascotas encontradas en Colombia"
        description="Estas mascotas están a salvo y buscan a su familia. Si reconoces a alguna, contacta a quien la encontró. Filtra por ciudad, especie o color, o reporta una mascota que encontraste."
      />
      <Container className="py-10 lg:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {total > 0
              ? `${total} ${total === 1 ? "reporte" : "reportes"}`
              : "Aún no hay reportes que coincidan"}
          </p>
          <Button asChild variant="warm">
            <Link href="/found-pets/reportar">
              Reportar una mascota encontrada
            </Link>
          </Button>
        </div>

        <div className="mb-10">
          <FoundPetsFilters
            initial={{
              city: filters.city,
              color: filters.color,
              species: filters.species,
            }}
          />
        </div>

        {pets.length > 0 ? (
          <>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => (
                <li key={pet.id}>
                  <FoundPetCard pet={pet} />
                </li>
              ))}
            </ul>
            <Pagination
              page={page}
              totalPages={totalPages}
              baseParams={baseParams}
              basePath="/found-pets"
            />
          </>
        ) : (
          <EmptyState hasFilters={hasFilters} />
        )}

        {/* Mascotas encontradas por estado (long-tail / búsqueda local) */}
        <section className="mt-16" aria-labelledby="encontradas-por-estado">
          <h2
            id="encontradas-por-estado"
            className="font-heading text-lg font-semibold"
          >
            Mascotas encontradas por estado
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Revisa las mascotas encontradas en tu estado.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {COLOMBIA_DEPARTMENTS.map((s) => (
              <Link
                key={s}
                href={`/found-pets/estado/${stateToSlug(s)}`}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {s}
              </Link>
            ))}
          </div>
        </section>

        <SocialPetsSection className="mt-16" />
      </Container>
    </>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <span className="bg-secondary text-primary grid size-14 place-items-center rounded-2xl">
        <PawPrint className="size-6" aria-hidden="true" />
      </span>
      <h2 className="font-heading mt-6 text-xl font-semibold">
        {hasFilters ? "Sin resultados" : "Todavía no hay reportes"}
      </h2>
      <p className="text-muted-foreground mt-2">
        {hasFilters
          ? "Prueba con otros filtros o limpia la búsqueda."
          : "Sé la primera persona en reportar una mascota encontrada."}
      </p>
      <Button asChild variant="warm" className="mt-6">
        <Link href="/found-pets/reportar">Reportar una mascota encontrada</Link>
      </Button>
    </div>
  );
}
