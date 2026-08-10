import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { Container } from "@/components/ui/container";
import { NewsForm } from "@/components/admin/news-form";

export const metadata: Metadata = {
  title: "Nueva noticia · Panel",
  robots: { index: false, follow: false },
};

export default async function NewNewsPage() {
  await requireAdmin();

  return (
    <>
      <Container className="py-10">
        <Link
          href="/admin/noticias"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Volver a noticias
        </Link>
        <h1 className="mb-8 text-2xl font-bold sm:text-3xl">Nueva noticia</h1>
        <div className="border-border bg-card max-w-2xl rounded-2xl border p-6 shadow-sm">
          <NewsForm
            mode="create"
            initial={{
              title: "",
              excerpt: "",
              content: "",
              category: "comunidad",
              isFeatured: false,
              publishedDate: "",
              tags: "",
              status: "borrador",
              cover: "",
            }}
          />
        </div>
      </Container>
    </>
  );
}
