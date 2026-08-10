import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope } from "lucide-react";

import { getFreeVetServices } from "@/lib/data/free-vets";
import { routes } from "@/config/navigation";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";
import { FreeVetCard } from "@/components/vets/free-vet-card";

export const metadata: Metadata = {
  alternates: { canonical: "/veterinarios-gratuitos" },
  title: "Veterinarios gratuitos en Colombia",
  description:
    "Directorio de jornadas y servicios veterinarios gratuitos para mascotas en Colombia. Encuentra sedes, horarios y teléfonos de contacto.",
};

// ISR: contenido curado por admin. Se regenera cada 10 min y al instante cuando
// el admin edita (las acciones llaman revalidatePath("/veterinarios-gratuitos")).
export const revalidate = 600;

export default async function FreeVetsPage() {
  const vets = await getFreeVetServices();

  return (
    <>
      <PageHeader
        eyebrow="Cómo ayudar"
        title="Veterinarios gratuitos"
        description="Jornadas y servicios veterinarios gratuitos para mascotas en Colombia. Revisa las sedes, horarios y teléfonos para contactarlos directamente."
      />
      <Container className="py-10 lg:py-14">
        <div className="border-warm/30 bg-warm-soft/40 mb-8 rounded-2xl border p-5 text-sm">
          <span className="font-medium">
            ¿Conoces una jornada veterinaria gratuita?
          </span>{" "}
          <Link href={routes.contact} className="text-primary underline">
            Escríbenos
          </Link>{" "}
          y la sumamos al directorio.
        </div>

        {vets.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vets.map((vet) => (
              <li key={vet.id}>
                <FreeVetCard vet={vet} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
            <span className="bg-secondary text-primary grid size-14 place-items-center rounded-2xl">
              <Stethoscope className="size-6" aria-hidden="true" />
            </span>
            <h2 className="font-heading mt-6 text-xl font-semibold">
              Aún no hay servicios publicados
            </h2>
            <p className="text-muted-foreground mt-2">
              Pronto aparecerán aquí las jornadas y servicios veterinarios
              gratuitos disponibles.
            </p>
          </div>
        )}

        <p className="text-muted-foreground mt-8 text-center text-xs">
          Confirma disponibilidad y requisitos directamente con cada servicio
          antes de acudir.
        </p>
      </Container>
    </>
  );
}
