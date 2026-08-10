import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ImageDown } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { getLostPetById, type LostPet } from "@/lib/data/lost-pets";
import { getFoundPetById, type FoundPet } from "@/lib/data/found-pets";
import { type PublicationKind } from "@/lib/data/admin-publications";
import { Container } from "@/components/ui/container";
import { PublicationEditForm } from "@/components/admin/publication-edit-form";

export const metadata: Metadata = {
  title: "Editar publicación · Panel",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ kind: string; id: string }>;
}

export default async function AdminPublicationEditPage({ params }: PageProps) {
  await requireAdmin();
  const { kind, id } = await params;
  if (kind !== "perdida" && kind !== "encontrada") notFound();
  const publicationKind = kind as PublicationKind;

  const pet =
    publicationKind === "perdida"
      ? await getLostPetById(id)
      : await getFoundPetById(id);
  if (!pet) notFound();

  const title = pet.name ?? "Publicación";

  const contact =
    publicationKind === "perdida"
      ? {
          contactName: (pet as LostPet).reporter_name ?? "",
          contactEmail: (pet as LostPet).reporter_email ?? "",
          contactPhone:
            (pet as LostPet).reporter_whatsapp ??
            (pet as LostPet).reporter_phone ??
            "",
        }
      : {
          contactName: (pet as FoundPet).finder_name ?? "",
          contactEmail: (pet as FoundPet).finder_email ?? "",
          contactPhone:
            (pet as FoundPet).finder_whatsapp ??
            (pet as FoundPet).finder_phone ??
            "",
        };

  return (
    <>
      <Container className="py-10">
        <Link
          href="/admin/publicaciones"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Volver a publicaciones
        </Link>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {publicationKind === "perdida"
                ? "Mascota perdida"
                : "Mascota encontrada"}{" "}
              · {pet.city}, {pet.state}
            </p>
          </div>
          <a
            href={`/api/instagram/${publicationKind}/${pet.id}`}
            download
            className="border-border bg-card hover:bg-secondary inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors"
          >
            <ImageDown className="size-4" />
            Descargar imagen para Instagram
          </a>
        </div>

        <div className="border-border bg-card max-w-2xl rounded-2xl border p-6 shadow-sm">
          <PublicationEditForm
            kind={publicationKind}
            id={pet.id}
            initial={{
              name: pet.name ?? "",
              breed: pet.breed ?? "",
              color: pet.color ?? "",
              sex: pet.sex ?? "desconocido",
              description: pet.description ?? "",
              city: pet.city ?? "",
              sector: pet.sector ?? "",
              ...contact,
            }}
          />
        </div>
      </Container>
    </>
  );
}
