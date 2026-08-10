import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { getNewsById } from "@/lib/data/news";
import { Container } from "@/components/ui/container";
import { NewsForm } from "@/components/admin/news-form";

export const metadata: Metadata = {
  title: "Editar noticia · Panel",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditNewsPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const news = await getNewsById(id);
  if (!news) notFound();

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
        <h1 className="mb-8 text-2xl font-bold sm:text-3xl">Editar noticia</h1>
        <div className="border-border bg-card max-w-2xl rounded-2xl border p-6 shadow-sm">
          <NewsForm
            mode="edit"
            id={news.id}
            initial={{
              title: news.title,
              excerpt: news.excerpt ?? "",
              content: news.content,
              category: news.category,
              isFeatured: news.is_featured,
              publishedDate: news.published_at
                ? news.published_at.slice(0, 10)
                : "",
              tags: news.tags.join(", "),
              status: news.status,
              cover: news.cover_url ?? "",
            }}
          />
        </div>
      </Container>
    </>
  );
}
