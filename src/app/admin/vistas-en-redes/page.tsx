import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { getAllSocialPetsForAdmin } from "@/lib/data/social-pets";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteSocialPet } from "@/app/admin/vistas-en-redes/actions";

export const metadata: Metadata = {
  title: "Vistas en redes · Panel",
  robots: { index: false, follow: false },
};

const SPECIES_LABEL: Record<string, string> = {
  perro: "Perro",
  gato: "Gato",
  ave: "Ave",
  otro: "Otro",
};

export default async function AdminSocialPetsPage() {
  await requireAdmin();
  const pets = await getAllSocialPetsForAdmin();

  return (
    <>
      <Container className="py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold sm:text-3xl">Vistas en redes</h1>
          <Button asChild>
            <Link href="/admin/vistas-en-redes/nuevo">
              <Plus className="size-4" />
              Nuevo
            </Link>
          </Button>
        </div>

        {pets.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border p-6 text-center text-sm">
            No hay videos registrados todavía.
          </p>
        ) : (
          <ul className="space-y-3">
            {pets.map((pet) => (
              <li
                key={pet.id}
                className="border-border bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading font-semibold">
                      {pet.title ??
                        (pet.species
                          ? `${SPECIES_LABEL[pet.species]} en redes`
                          : "Video en redes")}
                    </h2>
                    {!pet.is_published && (
                      <Badge variant="warning">Oculto</Badge>
                    )}
                    {pet.is_resolved && (
                      <Badge variant="success">Resuelto</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {[pet.city, pet.state].filter(Boolean).join(", ") || "—"}
                  </p>
                  <a
                    href={pet.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary mt-1 inline-block max-w-full truncate text-xs"
                  >
                    {pet.video_url}
                  </a>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/vistas-en-redes/${pet.id}`}>
                      <Pencil className="size-4" />
                      Editar
                    </Link>
                  </Button>
                  <DeleteButton action={deleteSocialPet.bind(null, pet.id)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
