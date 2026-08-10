import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";
import { VolunteerForm } from "@/components/volunteers/volunteer-form";

export const metadata: Metadata = {
  alternates: { canonical: "/voluntarios/unirse" },
  title: "Hazte voluntario",
  description:
    "Únete como voluntario para ayudar a las mascotas de Colombia: veterinario, transportista, casa temporal, rescatista y más.",
};

export default function VolunteerJoinPage() {
  return (
    <>
      <PageHeader
        eyebrow="Súmate"
        title="Hazte voluntario"
        description="Cada ayuda cuenta. Regístrate y te contactaremos para coordinar cómo puedes colaborar. Si quieres, puedes aparecer en el directorio público para que los refugios te contacten directamente."
      />
      <Container className="py-12 lg:py-16">
        <div className="mx-auto max-w-2xl">
          <VolunteerForm />
        </div>
      </Container>
    </>
  );
}
