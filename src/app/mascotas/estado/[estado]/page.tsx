import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getActiveLostPets } from "@/lib/data/lost-pets";
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
import { LostPetCard } from "@/components/lost-pets/lost-pet-card";
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
  if (!state) return { title: "Estado no encontrado" };

  const title = `Mascotas perdidas en ${state} | Encuentra a tu mascota`;
  return {
    title,
    description: `Mascotas perdidas y extraviadas en ${state}, Colombia. Busca perros y gatos por especie y color, o reporta a tu mascota gratis para ayudarla a volver a casa.`,
    alternates: { canonical: `/mascotas/estado/${estado}` },
    openGraph: { title, url: `/mascotas/estado/${estado}` },
  };
}

export default async function LostPetsByStatePage({
  params,
  searchParams,
}: PageProps) {
  const { estado } = await params;
  const state = slugToState(estado);
  if (!state) notFound();

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 12;

  const { items: pets, total } = await getActiveLostPets({
    page,
    pageSize,
    state,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PageHeader
        eyebrow="Mascotas perdidas por estado"
        title={`Mascotas perdidas en ${state}`}
        description={`Mascotas perdidas reportadas en ${state}. Si has visto alguna, contacta a su familia desde su ficha. También puedes reportar a tu mascota gratis para que vuelva a casa.`}
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
                name: "Mascotas perdidas",
                item: `${siteConfig.url}/mascotas`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: state,
                item: `${siteConfig.url}/mascotas/estado/${estado}`,
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
          <Link href="/mascotas" className="hover:text-foreground">
            Mascotas perdidas
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{state}</span>
        </nav>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {total > 0
              ? `${total} ${total === 1 ? "mascota en búsqueda" : "mascotas en búsqueda"} en ${state}`
              : `Aún no hay reportes activos en ${state}`}
          </p>
          <Button asChild variant="warm">
            <Link href="/reportar/perdida">Reportar perdida</Link>
          </Button>
        </div>

        {pets.length > 0 ? (
          <>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => (
                <li key={pet.id}>
                  <LostPetCard pet={pet} />
                </li>
              ))}
            </ul>
            <Pagination
              page={page}
              totalPages={totalPages}
              baseParams={{}}
              basePath={`/mascotas/estado/${estado}`}
            />
          </>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
            <h2 className="font-heading text-xl font-semibold">
              Todavía no hay mascotas perdidas reportadas en {state}
            </h2>
            <p className="text-muted-foreground mt-2">
              Cuando una familia publique un reporte en {state}, aparecerá aquí.
            </p>
            <Button asChild variant="warm" className="mt-6">
              <Link href="/reportar/perdida">Reportar una mascota perdida</Link>
            </Button>
          </div>
        )}

        {/* Otros estados */}
        <section className="mt-16" aria-labelledby="otros-estados">
          <h2 id="otros-estados" className="font-heading text-lg font-semibold">
            Mascotas perdidas en otros estados
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {COLOMBIA_DEPARTMENTS.map((s) => {
              const active = s === state;
              return (
                <Link
                  key={s}
                  href={`/mascotas/estado/${stateToSlug(s)}`}
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
