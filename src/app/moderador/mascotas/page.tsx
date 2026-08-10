import type { Metadata } from "next";

import { requireModerator } from "@/lib/auth/moderator";
import {
  getModeratorPets,
  type ModeratorFilter,
} from "@/lib/data/moderator-pets";
import { type PublicationKind } from "@/lib/data/admin-publications";
import { Container } from "@/components/ui/container";
import { ModeratorHeader } from "@/components/moderador/moderator-header";
import { ModerationToolbar } from "@/components/moderador/moderation-toolbar";
import { PetModerationCard } from "@/components/moderador/pet-moderation-card";

export const metadata: Metadata = {
  title: "Moderar mascotas · Panel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ tipo?: string; filtro?: string; q?: string }>;
}

export default async function ModeratorPetsPage({ searchParams }: PageProps) {
  const mod = await requireModerator();
  const sp = await searchParams;

  const kind: PublicationKind | undefined =
    sp.tipo === "perdida" || sp.tipo === "encontrada" ? sp.tipo : undefined;
  const filter: ModeratorFilter =
    sp.filtro === "pendientes"
      ? "pendientes"
      : sp.filtro === "reunidas"
        ? "reunidas"
        : "activas";

  const pets = await getModeratorPets({ kind, filter, search: sp.q });

  return (
    <>
      <ModeratorHeader admin={mod} />
      <Container className="py-8">
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">
          Moderar mascotas
        </h1>

        <ModerationToolbar />

        <p className="text-muted-foreground mt-6 mb-3 text-sm">
          {pets.length} {pets.length === 1 ? "resultado" : "resultados"}
        </p>

        {pets.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border p-6 text-center text-sm">
            No hay mascotas que coincidan con estos filtros.
          </p>
        ) : (
          <ul className="space-y-4">
            {pets.map((pet) => (
              <li key={`${pet.kind}-${pet.id}`}>
                <PetModerationCard pet={pet} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
