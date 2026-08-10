import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, PencilLine, Plus } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { getAllSheltersForAdmin } from "@/lib/data/shelters";
import {
  SHELTER_KIND_LABELS,
  SHELTER_NEED_LABELS,
  shelterLocationLabel,
} from "@/lib/constants/shelters";
import { type ShelterStatusEnum } from "@/types/database";
import { Container } from "@/components/ui/container";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteShelterButton } from "@/components/admin/delete-shelter-button";

export const metadata: Metadata = {
  title: "Refugios · Panel",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<ShelterStatusEnum, string> = {
  pendiente: "Pendiente",
  verificado: "Verificado",
  suspendido: "Suspendido",
};
const STATUS_VARIANT: Record<ShelterStatusEnum, BadgeProps["variant"]> = {
  pendiente: "warning",
  verificado: "success",
  suspendido: "secondary",
};

export default async function AdminSheltersPage() {
  await requireAdmin();
  const shelters = await getAllSheltersForAdmin();

  return (
    <>
      <Container className="py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Centros de acopio y refugios
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Registra refugios y gestiona su estado y necesidades.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/refugios/nuevo">
              <Plus className="size-4" />
              Nuevo refugio
            </Link>
          </Button>
        </div>

        {shelters.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border p-6 text-center text-sm">
            No hay refugios registrados todavía.
          </p>
        ) : (
          <ul className="space-y-3">
            {shelters.map((shelter) => (
              <li
                key={shelter.id}
                className="border-border bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading font-semibold">
                      {shelter.name}
                    </h2>
                    <Badge variant="secondary">
                      {SHELTER_KIND_LABELS[shelter.kind]}
                    </Badge>
                    <Badge variant={STATUS_VARIANT[shelter.status]}>
                      {STATUS_LABEL[shelter.status]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {shelterLocationLabel(shelter)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {shelter.needs.length > 0
                      ? `Necesita: ${shelter.needs.map((n) => SHELTER_NEED_LABELS[n]).join(", ")}`
                      : "Sin necesidades marcadas"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      href={`/refugios/${shelter.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-4" />
                      Ver
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/admin/refugios/${shelter.id}`}>
                      <PencilLine className="size-4" />
                      Editar
                    </Link>
                  </Button>
                  <DeleteShelterButton id={shelter.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
