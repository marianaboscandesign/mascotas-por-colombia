import type { Metadata } from "next";
import { SearchX } from "lucide-react";

import { searchPets } from "@/lib/data/search";
import { SPECIES_OPTIONS } from "@/lib/constants/pets";
import { COLOMBIA_DEPARTMENTS } from "@/lib/constants/colombia";
import {
  type PetSpeciesEnum,
  type SearchableKind,
  type ColombiaDepartmentEnum,
} from "@/types/database";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { GlobalSearch } from "@/components/search/global-search";
import { PhotoSearch } from "@/components/matches/photo-search";
import { SearchResultCard } from "@/components/search/search-result-card";

export const metadata: Metadata = {
  alternates: { canonical: "/buscar" },
  title: "Buscar mascotas",
  description:
    "Buscador global: encuentra mascotas perdidas, encontradas y rescatadas por nombre, ciudad, estado, especie, color o raza.",
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    state?: string;
    species?: string;
    kind?: string;
    page?: string;
  }>;
}

const SPECIES_VALUES = SPECIES_OPTIONS.map((o) => o.value) as string[];
const ALL_KINDS: SearchableKind[] = ["perdida", "encontrada", "rescatada"];

function parseSpecies(v?: string): PetSpeciesEnum | undefined {
  return v && SPECIES_VALUES.includes(v) ? (v as PetSpeciesEnum) : undefined;
}
function parseState(v?: string): ColombiaDepartmentEnum | undefined {
  return v && (COLOMBIA_DEPARTMENTS as readonly string[]).includes(v)
    ? (v as ColombiaDepartmentEnum)
    : undefined;
}
function parseKinds(v?: string): SearchableKind[] {
  if (!v) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is SearchableKind => (ALL_KINDS as string[]).includes(s));
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const state = parseState(sp.state);
  const species = parseSpecies(sp.species);
  const kinds = parseKinds(sp.kind);
  const page = Math.max(1, Number(sp.page) || 1);

  const result = await searchPets({ q, state, species, kinds, page });

  // Parámetros (sin page) para conservar filtros al paginar.
  const baseParams: Record<string, string> = {};
  if (q) baseParams.q = q;
  if (state) baseParams.state = state;
  if (species) baseParams.species = species;
  if (kinds.length > 0 && kinds.length < ALL_KINDS.length) {
    baseParams.kind = kinds.join(",");
  }

  const hasFilters =
    Boolean(q || state || species) ||
    (kinds.length > 0 && kinds.length < ALL_KINDS.length);

  return (
    <>
      <PageHeader
        eyebrow="Buscador"
        title="Buscar mascotas"
        description="Busca en todos los reportes de la plataforma: perdidas, encontradas y rescatadas."
      />
      <Container className="py-10 lg:py-14">
        <div className="mb-8">
          <PhotoSearch />
        </div>

        <GlobalSearch initial={{ q, state, species, kinds }} />

        <div className="mt-8">
          <p className="text-muted-foreground mb-6 text-sm" aria-live="polite">
            {result.total > 0
              ? `${result.total} ${result.total === 1 ? "resultado" : "resultados"}`
              : "Sin resultados"}
          </p>

          {result.items.length > 0 ? (
            <>
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {result.items.map((pet) => (
                  <li key={`${pet.kind}-${pet.id}`}>
                    <SearchResultCard pet={pet} />
                  </li>
                ))}
              </ul>
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                baseParams={baseParams}
              />
            </>
          ) : (
            <EmptyState hasFilters={hasFilters} />
          )}
        </div>
      </Container>
    </>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <span className="bg-secondary text-primary grid size-14 place-items-center rounded-2xl">
        <SearchX className="size-6" aria-hidden="true" />
      </span>
      <h2 className="font-heading mt-6 text-xl font-semibold">
        {hasFilters ? "Sin coincidencias" : "Aún no hay reportes"}
      </h2>
      <p className="text-muted-foreground mt-2">
        {hasFilters
          ? "Prueba con otros términos o ajusta los filtros."
          : "Cuando la comunidad publique reportes, aparecerán aquí."}
      </p>
    </div>
  );
}
