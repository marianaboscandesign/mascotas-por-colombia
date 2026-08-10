import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";
import { FoundPetForm } from "@/components/found-pets/found-pet-form";

export const metadata: Metadata = {
  alternates: { canonical: "/found-pets/reportar" },
  title: "Reportar mascota encontrada",
  description:
    "Encontraste una mascota. Publica un reporte con fotos y ubicación para ayudar a reunirla con su familia.",
};

export default function ReportarEncontradaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reporte"
        title="Reportar una mascota encontrada"
        description="Gracias por ayudar. Comparte lo que viste para acercar a esta mascota a su hogar."
      />
      <Container className="py-12 lg:py-16">
        <div className="mx-auto max-w-2xl">
          <FoundPetForm />
        </div>
      </Container>
    </>
  );
}
