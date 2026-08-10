import Image from "next/image";
import Link from "next/link";

import { type News } from "@/lib/data/news";
import { newsImageUrl } from "@/lib/storage/news";
import { NEWS_CATEGORY_LABELS } from "@/lib/constants/news";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function NewsCard({
  news,
  featured = false,
}: {
  news: News;
  featured?: boolean;
}) {
  const date = news.published_at ?? news.created_at;

  return (
    <Link
      href={`/noticias/${news.slug}`}
      className="group focus-visible:ring-ring border-border bg-card flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div
        className={cn(
          "bg-muted relative overflow-hidden",
          featured ? "aspect-[16/9]" : "aspect-[3/2]",
        )}
      >
        {news.cover_url ? (
          <Image
            src={newsImageUrl(news.cover_url)}
            alt={news.title}
            fill
            sizes={featured ? "100vw" : "(max-width: 1024px) 50vw, 33vw"}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="from-secondary/60 to-background h-full bg-gradient-to-br" />
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="secondary">
            {NEWS_CATEGORY_LABELS[news.category]}
          </Badge>
          {news.is_featured && <Badge variant="warm">Destacada</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <time className="text-muted-foreground text-xs">
          {formatDate(date)}
        </time>
        <h3
          className={cn(
            "font-heading mt-1 font-semibold",
            featured ? "text-xl" : "text-base",
          )}
        >
          {news.title}
        </h3>
        {news.excerpt && (
          <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
            {news.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
