import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata: Metadata = {
  alternates: { canonical: "/sobre-nosotros" },
  title: "Sobre nosotros",
  description:
    "Somos una iniciativa solidaria nacida para ayudar a las mascotas de Colombia tras el terremoto.",
};

export default function SobreNosotrosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Quiénes somos"
        title="Sobre nosotros"
        description="Una comunidad de voluntarios, familias y amantes de los animales unidos por una causa."
      />
      <ComingSoon note="Pronto compartiremos nuestra historia, misión y al equipo detrás del proyecto." />
    </>
  );
}
