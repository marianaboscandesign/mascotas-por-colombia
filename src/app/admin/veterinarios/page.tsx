import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { getAllFreeVetsForAdmin } from "@/lib/data/free-vets";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteFreeVet } from "@/app/admin/veterinarios/actions";

export const metadata: Metadata = {
  title: "Veterinarios gratuitos · Panel",
  robots: { index: false, follow: false },
};

export default async function AdminFreeVetsPage() {
  await requireAdmin();
  const vets = await getAllFreeVetsForAdmin();

  return (
    <>
      <Container className="py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Veterinarios gratuitos
          </h1>
          <Button asChild>
            <Link href="/admin/veterinarios/nuevo">
              <Plus className="size-4" />
              Nuevo
            </Link>
          </Button>
        </div>

        {vets.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border p-6 text-center text-sm">
            No hay servicios registrados todavía.
          </p>
        ) : (
          <ul className="space-y-3">
            {vets.map((vet) => (
              <li
                key={vet.id}
                className="border-border bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading font-semibold">{vet.name}</h2>
                    {!vet.is_published && (
                      <Badge variant="warning">Oculto</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {[vet.city, vet.region ?? vet.state]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {vet.sedes.length} sede(s) · {vet.phones.length} teléfono(s)
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/veterinarios/${vet.id}`}>
                      <Pencil className="size-4" />
                      Editar
                    </Link>
                  </Button>
                  <DeleteButton action={deleteFreeVet.bind(null, vet.id)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
