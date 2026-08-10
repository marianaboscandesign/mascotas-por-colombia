import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getFoundPets } from "@/lib/data/found-pets";
import {
  COLOMBIA_DEPARTMENTS,
  slugToState,
  stateToSlug,
} from "@/lib/constants/colombia";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";
import { FoundPetCard } from "@/components/found-pets/found-pet-card";
import { Pagination } from "@/components/common/pagination";

interface PageProps {
  params: Promise<{ estado: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { estado } = await params;
  const state = slugToState(estado);
  if (!state) return { title: "Departamento no encontrado" };

  const title = `Mascotas encontradas en ${state} | ¿Reconoces a alguna?`;
  return {
    title,
    description: `Mascotas encontradas y rescatadas en ${state}, Colombia. Revisa si alguna es tuya o de alguien que conoces, o reporta una mascota que encontraste.`,
    alternates: { canonical: `/found-pets/departamento/${estado}` },
    openGraph: { title, url: `/found-pets/departamento/${estado}` },
  };
}

export default async function FoundPetsByStatePage({
  params,
  searchParams,
}: PageProps) {
  const { estado } = await params;
  const state = slugToState(estado);
  if (!state) notFound();

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 12;

  const { items: pets, total } = await getFoundPets({ page, pageSize, state });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PageHeader
        eyebrow="Mascotas encontradas por departamento"
        title={`Mascotas encontradas en ${state}`}
        description={`Mascotas encontradas y a salvo en ${state}. ¿Reconoces a alguna? Contacta a quien la encontró desde su ficha, o reporta una mascota que hallaste.`}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Inicio",
                item: siteConfig.url,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Mascotas encontradas",
                item: `${siteConfig.url}/found-pets`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: state,
                item: `${siteConfig.url}/found-pets/departamento/${estado}`,
              },
            ],
          }),
        }}
      />

      <Container className="py-10 lg:py-14">
        <nav
          className="text-muted-foreground mb-6 text-sm"
          aria-label="Ruta de navegación"
        >
          <Link href="/found-pets" className="hover:text-foreground">
            Mascotas encontradas
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{state}</span>
        </nav>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {total > 0
              ? `${total} ${total === 1 ? "mascota encontrada" : "mascotas encontradas"} en ${state}`
              : `Aún no hay reportes en ${state}`}
          </p>
          <Button asChild>
            <Link href="/found-pets/reportar">Reportar encontrada</Link>
          </Button>
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
              baseParams={{}}
              basePath={`/found-pets/departamento/${estado}`}
            />
          </>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
            <h2 className="font-heading text-xl font-semibold">
              Todavía no hay mascotas encontradas reportadas en {state}
            </h2>
            <p className="text-muted-foreground mt-2">
              Cuando alguien reporte una mascota encontrada en {state},
              aparecerá aquí.
            </p>
            <Button asChild className="mt-6">
              <Link href="/found-pets/reportar">
                Reportar una mascota encontrada
              </Link>
            </Button>
          </div>
        )}

        {/* Otros estados */}
        <section className="mt-16" aria-labelledby="otros-estados">
          <h2 id="otros-estados" className="font-heading text-lg font-semibold">
            Mascotas encontradas en otros departamentos
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {COLOMBIA_DEPARTMENTS.map((s) => {
              const active = s === state;
              return (
                <Link
                  key={s}
                  href={`/found-pets/departamento/${stateToSlug(s)}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {s}
                </Link>
              );
            })}
          </div>
        </section>
      </Container>
    </>
  );
}
