import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { getActiveLostPets } from "@/lib/data/lost-pets";
import { COLOMBIA_DEPARTMENTS, stateToSlug } from "@/lib/constants/colombia";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";
import { LostPetCard } from "@/components/lost-pets/lost-pet-card";
import { Pagination } from "@/components/common/pagination";
import { FaqSection, type FaqItem } from "@/components/seo/faq-section";
import { SocialPetsSection } from "@/components/social/social-pets-section";

export const metadata: Metadata = {
  alternates: { canonical: "/mascotas" },
  title: "Mascotas perdidas en Colombia | Encuentra a tu mascota",
  description:
    "Encuentra mascotas perdidas en Colombia: busca perros y gatos extraviados por estado, especie y color, o reporta a tu mascota gratis para que vuelva a casa.",
};

const FAQS: FaqItem[] = [
  {
    question: "¿Cómo encontrar una mascota perdida en Colombia?",
    answer:
      "Revisa el directorio de mascotas perdidas y encontradas filtrando por estado, especie y color. Si no la ves, reporta a tu mascota perdida gratis para que más personas en tu zona puedan ayudarte a encontrarla. La plataforma busca coincidencias automáticamente con las mascotas encontradas.",
  },
  {
    question: "¿Qué hago si encontré una mascota en la calle?",
    answer:
      "Repórtala como mascota encontrada con una foto y la zona donde la viste. La plataforma buscará coincidencias con mascotas perdidas y mostrará la ficha para que su familia pueda contactarte.",
  },
  {
    question: "¿Cuánto cuesta usar Mascotas por Colombia?",
    answer:
      "Es totalmente gratis. Reportar, buscar y contactar no tiene ningún costo: es una plataforma solidaria para reunir mascotas con sus familias.",
  },
  {
    question: "¿Cómo reporto a mi mascota perdida?",
    answer:
      "Toca 'Reportar mascota perdida', sube una foto y completa lo esencial (especie, estado y un medio de contacto). En minutos se publica su ficha pública para ayudar a encontrarla.",
  },
  {
    question: "¿En qué zonas de Colombia funciona?",
    answer:
      "En toda Colombia. Puedes filtrar por estado (Bogotá, Antioquia, Valle del Cauca, Atlántico y más) para enfocar la búsqueda en tu ciudad o región.",
  },
  {
    question: "¿Cómo aumento las posibilidades de encontrar a mi mascota?",
    answer:
      "Agrega una buena foto, el color y la última zona donde la viste, y comparte su ficha en redes sociales y grupos de tu comunidad. Mientras más personas la vean, mayor la posibilidad de un reencuentro.",
  },
];

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function LostPetsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 12;

  const { items: pets, total } = await getActiveLostPets({ page, pageSize });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PageHeader
        eyebrow="Directorio"
        title="Mascotas perdidas en Colombia"
        description="Encuentra mascotas perdidas en Colombia y ayuda a que vuelvan a casa. Estas mascotas siguen sin aparecer: si has visto alguna, contacta a su familia desde su ficha. Filtra por estado, especie o color, o reporta a tu mascota gratis."
      />
      <Container className="py-10 lg:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {total > 0
              ? `${total} ${total === 1 ? "mascota en búsqueda" : "mascotas en búsqueda"}`
              : "Aún no hay reportes activos"}
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/buscar?kind=perdida">
                <Search className="size-4" />
                Búsqueda avanzada
              </Link>
            </Button>
            <Button asChild variant="warm">
              <Link href="/reportar/perdida">Reportar perdida</Link>
            </Button>
          </div>
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
              basePath="/mascotas"
            />
          </>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
            <h2 className="font-heading text-xl font-semibold">
              Todavía no hay mascotas perdidas reportadas
            </h2>
            <p className="text-muted-foreground mt-2">
              Cuando una familia publique un reporte, aparecerá aquí.
            </p>
            <Button asChild variant="warm" className="mt-6">
              <Link href="/reportar/perdida">Reportar una mascota perdida</Link>
            </Button>
          </div>
        )}

        {/* Mascotas perdidas por estado (long-tail / búsqueda local) */}
        <section className="mt-16" aria-labelledby="por-estado">
          <h2 id="por-estado" className="font-heading text-lg font-semibold">
            Mascotas perdidas por estado
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Busca mascotas perdidas en tu estado.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {COLOMBIA_DEPARTMENTS.map((s) => (
              <Link
                key={s}
                href={`/mascotas/estado/${stateToSlug(s)}`}
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

        <FaqSection items={FAQS} className="mt-16" />
      </Container>
    </>
  );
}
