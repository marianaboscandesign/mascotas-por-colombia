import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { getAllDonationOrgsForAdmin } from "@/lib/data/donations";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteDonationOrg } from "@/app/admin/donaciones/actions";

export const metadata: Metadata = {
  title: "Donaciones · Panel",
  robots: { index: false, follow: false },
};

export default async function AdminDonationsPage() {
  await requireAdmin();
  const orgs = await getAllDonationOrgsForAdmin();

  return (
    <>
      <Container className="py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold sm:text-3xl">Donaciones</h1>
          <Button asChild>
            <Link href="/admin/donaciones/nueva">
              <Plus className="size-4" />
              Nueva
            </Link>
          </Button>
        </div>

        {orgs.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border p-6 text-center text-sm">
            No hay organizaciones todavía.
          </p>
        ) : (
          <ul className="space-y-3">
            {orgs.map((org) => (
              <li
                key={org.id}
                className="border-border bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading font-semibold">{org.name}</h2>
                    {!org.is_published && (
                      <Badge variant="warning">Oculta</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
                    {org.description}
                  </p>
                  <a
                    href={org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary mt-1 inline-block max-w-full truncate text-xs"
                  >
                    {org.url_label}
                  </a>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/donaciones/${org.id}`}>
                      <Pencil className="size-4" />
                      Editar
                    </Link>
                  </Button>
                  <DeleteButton action={deleteDonationOrg.bind(null, org.id)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
