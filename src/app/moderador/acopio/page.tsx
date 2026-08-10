import type { Metadata } from "next";

import { requireModerator } from "@/lib/auth/moderator";
import { Container } from "@/components/ui/container";
import { ComingSoon } from "@/components/common/coming-soon";
import { ModeratorHeader } from "@/components/moderador/moderator-header";

export const metadata: Metadata = {
  title: "Centros de acopio · Moderación",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const mod = await requireModerator();
  return (
    <>
      <ModeratorHeader admin={mod} />
      <Container className="py-8">
        <h1 className="mb-4 text-2xl font-bold sm:text-3xl">
          Centros de acopio
        </h1>
        <ComingSoon note="La edición de Centros de acopio desde el panel de moderación estará disponible muy pronto." />
      </Container>
    </>
  );
}
