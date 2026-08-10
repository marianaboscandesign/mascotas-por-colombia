import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { getNewsBySlug } from "@/lib/data/news";
import { newsImageUrl } from "@/lib/storage/news";
import {
  NEWS_CATEGORY_LABELS,
  NEWS_PUBLIC_ENABLED,
} from "@/lib/constants/news";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const news = await getNewsBySlug(slug);
  if (!news) return { title: "Noticia no encontrada" };

  return {
    title: news.title,
    description: news.excerpt ?? news.content.slice(0, 160),
    openGraph: {
      title: news.title,
      description: news.excerpt ?? undefined,
      type: "article",
      images: news.cover_url
        ? [{ url: newsImageUrl(news.cover_url) }]
        : undefined,
    },
  };
}

export default async function NewsArticlePage({ params }: PageProps) {
  if (!NEWS_PUBLIC_ENABLED) notFound();

  const { slug } = await params;
  const news = await getNewsBySlug(slug);
  if (!news) notFound();

  const date = news.published_at ?? news.created_at;

  return (
    <Container className="py-10 lg:py-14">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/noticias"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Volver a noticias
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">
            {NEWS_CATEGORY_LABELS[news.category]}
          </Badge>
          <time className="text-muted-foreground text-sm">
            {formatDate(date)}
          </time>
        </div>

        <h1 className="mt-4 text-3xl font-bold text-balance sm:text-4xl">
          {news.title}
        </h1>

        {news.excerpt && (
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            {news.excerpt}
          </p>
        )}

        {news.cover_url && (
          <div className="border-border bg-muted relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border">
            <Image
              src={newsImageUrl(news.cover_url)}
              alt={news.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        <div className="text-foreground/90 mt-8 leading-relaxed whitespace-pre-line">
          {news.content}
        </div>

        {news.tags.length > 0 && (
          <div className="border-border mt-10 flex flex-wrap gap-2 border-t pt-6">
            {news.tags.map((tag) => (
              <span
                key={tag}
                className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </Container>
  );
}
