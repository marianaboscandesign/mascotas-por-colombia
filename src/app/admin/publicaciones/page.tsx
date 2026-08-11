import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/admin";
import { getAdminPublications } from "@/lib/data/admin-publications";
import { Container } from "@/components/ui/container";
import { PublicationRow } from "@/components/admin/publication-row";
import { PublicationFilters } from "@/components/admin/publication-filters";

export const metadata: Metadata = {
  title: "Publicaciones · Panel",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{
    tipo?: string;
    estado?: string;
    q?: string;
    especie?: string;
    edo?: string;
  }>;
}

function normalize(text: string): string {
  return text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export default async function AdminPublicationsPage({
  searchParams,
}: PageProps) {
  await requireAdmin();
  const { tipo, estado, q, especie, edo } = await searchParams;
  const all = await getAdminPublications();

  let items = all;
  if (tipo === "perdida" || tipo === "encontrada") {
    // Una perdida cuyo estado ya es "encontrada" cuenta como encontrada para
    // filtrar (aparece en "Encontradas", no en "Perdidas").
    const shownKind = (p: (typeof all)[number]) =>
      p.kind === "perdida" && p.status === "encontrada" ? "encontrada" : p.kind;
    items = items.filter((p) => shownKind(p) === tipo);
  }
  if (estado === "ocultas") {
    items = items.filter((p) => !p.isApproved);
  } else if (estado === "urgentes") {
    items = items.filter((p) => p.isFeatured);
  }
  if (especie) {
    items = items.filter((p) => p.species === especie);
  }
  if (edo) {
    items = items.filter((p) => p.state === edo);
  }
  if (q && q.trim()) {
    const needle = normalize(q);
    items = items.filter(
      (p) =>
        normalize(p.name ?? "").includes(needle) ||
        normalize(p.city ?? "").includes(needle),
    );
  }

  return (
    <>
      <Container className="py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Publicaciones</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Aprueba, edita, destaca o elimina reportes de mascotas.
          </p>
        </div>

        <PublicationFilters initial={{ tipo, estado, q, especie, edo }} />

        <p className="text-muted-foreground mb-4 text-sm" aria-live="polite">
          {items.length} {items.length === 1 ? "publicación" : "publicaciones"}
        </p>

        {items.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border p-6 text-center text-sm">
            No hay publicaciones que coincidan.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((pub) => (
              <PublicationRow key={`${pub.kind}-${pub.id}`} pub={pub} />
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
