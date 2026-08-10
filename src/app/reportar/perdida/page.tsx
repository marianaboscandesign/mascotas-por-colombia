import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";
import { LostPetForm } from "@/components/lost-pets/lost-pet-form";

export const metadata: Metadata = {
  alternates: { canonical: "/reportar/perdida" },
  title: "Reportar mascota perdida",
  description:
    "Crea un reporte de tu mascota perdida para que la comunidad te ayude a encontrarla.",
};

export default function ReportarPerdidaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reporte"
        title="Reportar una mascota perdida"
        description="Cuéntanos sobre tu mascota: cuantos más detalles y fotos, más fácil será reconocerla."
      />
      <Container className="py-12 lg:py-16">
        <div className="mx-auto max-w-2xl">
          <LostPetForm />
        </div>
      </Container>
    </>
  );
}
