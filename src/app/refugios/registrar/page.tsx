import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";
import { ShelterForm } from "@/components/admin/shelter-form";

export const metadata: Metadata = {
  alternates: { canonical: "/refugios/registrar" },
  title: "Registra tu centro de acopio",
  description:
    "¿Tienes un centro de acopio o refugio para mascotas? Regístralo gratis y publica qué necesitas. Lo revisaremos y aparecerá en el directorio público.",
};

export default function ShelterRegisterPage() {
  return (
    <>
      <PageHeader
        eyebrow="Súmate"
        title="Registra tu centro de acopio o refugio"
        description="Cuéntanos qué necesitas para las mascotas. Tras una revisión rápida, tu centro aparecerá en el directorio para que la comunidad pueda ayudarte."
      />
      <Container className="py-12 lg:py-16">
        <div className="border-border bg-card mx-auto max-w-2xl rounded-2xl border p-6 shadow-sm sm:p-8">
          <ShelterForm mode="create" variant="public" />
        </div>
      </Container>
    </>
  );
}
