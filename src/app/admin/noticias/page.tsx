import type { Metadata } from "next";
import Link from "next/link";
import { Plus, PencilLine } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { getAllNewsForAdmin } from "@/lib/data/news";
import { formatDate } from "@/lib/utils";
import { type NewsStatusEnum } from "@/types/database";
import { Container } from "@/components/ui/container";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteNewsButton } from "@/components/admin/delete-news-button";

export const metadata: Metadata = {
  title: "Noticias · Panel",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<NewsStatusEnum, string> = {
  borrador: "Borrador",
  publicado: "Publicado",
  archivado: "Archivado",
};
const STATUS_VARIANT: Record<NewsStatusEnum, BadgeProps["variant"]> = {
  borrador: "warning",
  publicado: "success",
  archivado: "secondary",
};

export default async function AdminNewsPage() {
  await requireAdmin();
  const news = await getAllNewsForAdmin();

  return (
    <>
      <Container className="py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Noticias</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Crea y gestiona los comunicados de la plataforma.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/noticias/nueva">
              <Plus className="size-4" />
              Nueva
            </Link>
          </Button>
        </div>

        {news.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border p-6 text-center text-sm">
            Aún no hay noticias. Crea la primera.
          </p>
        ) : (
          <ul className="space-y-3">
            {news.map((n) => (
              <li
                key={n.id}
                className="border-border bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading truncate font-semibold">
                      {n.title}
                    </h2>
                    <Badge variant={STATUS_VARIANT[n.status]}>
                      {STATUS_LABEL[n.status]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {n.published_at
                      ? `Publicado el ${formatDate(n.published_at)}`
                      : `Creado el ${formatDate(n.created_at)}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/noticias/${n.id}`}>
                      <PencilLine className="size-4" />
                      Editar
                    </Link>
                  </Button>
                  <DeleteNewsButton id={n.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
