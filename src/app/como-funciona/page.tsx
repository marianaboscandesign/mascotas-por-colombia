import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata: Metadata = {
  alternates: { canonical: "/como-funciona" },
  title: "Cómo funciona",
  description:
    "Conoce en tres pasos cómo Mascotas por Colombia ayuda a reunir mascotas con sus familias.",
};

export default function ComoFuncionaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Guía"
        title="Cómo funciona"
        description="Reportar, buscar y reencontrar: un proceso simple pensado para momentos difíciles."
      />
      <ComingSoon note="Aquí explicaremos paso a paso el proceso completo." />
    </>
  );
}
