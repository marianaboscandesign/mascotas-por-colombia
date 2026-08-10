import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Newspaper } from "lucide-react";

import { getFeaturedNews, getPublishedNews } from "@/lib/data/news";
import {
  NEWS_CATEGORIES,
  NEWS_CATEGORY_VALUES,
  NEWS_PUBLIC_ENABLED,
} from "@/lib/constants/news";
import { cn } from "@/lib/utils";
import { type NewsCategoryEnum } from "@/types/database";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";
import { NewsCard } from "@/components/news/news-card";

export const metadata: Metadata = {
  title: "Noticias",
  description:
    "Noticias, campañas y consejos de Mascotas por Colombia: rescates, adopciones y cómo ayudar.",
};

interface PageProps {
  searchParams: Promise<{ categoria?: string }>;
}

function parseCategory(v?: string): NewsCategoryEnum | undefined {
  return v && (NEWS_CATEGORY_VALUES as string[]).includes(v)
    ? (v as NewsCategoryEnum)
    : undefined;
}

export default async function NewsPage({ searchParams }: PageProps) {
  if (!NEWS_PUBLIC_ENABLED) notFound();

  const { categoria } = await searchParams;
  const category = parseCategory(categoria);

  const [featured, news] = await Promise.all([
    category ? Promise.resolve([]) : getFeaturedNews(3),
    getPublishedNews(category),
  ]);

  const featuredIds = new Set(featured.map((n) => n.id));
  const rest = news.filter((n) => !featuredIds.has(n.id));

  return (
    <>
      <PageHeader
        eyebrow="Actualidad"
        title="Noticias"
        description="Historias de rescate, campañas, jornadas de adopción y consejos para cuidar a nuestras mascotas."
      />
      <Container className="py-10 lg:py-14">
        {/* Destacadas */}
        {featured.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading mb-5 text-lg font-semibold">
              Destacadas
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {featured.map((n, i) => (
                <div key={n.id} className={cn(i === 0 && "lg:row-span-2")}>
                  <NewsCard news={n} featured />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filtro por categoría */}
        <div className="mb-8 flex flex-wrap gap-2">
          <CategoryChip label="Todas" href="/noticias" active={!category} />
          {NEWS_CATEGORIES.map((c) => (
            <CategoryChip
              key={c.value}
              label={c.label}
              href={`/noticias?categoria=${c.value}`}
              active={category === c.value}
            />
          ))}
        </div>

        {rest.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((n) => (
              <li key={n.id}>
                <NewsCard news={n} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
            <span className="bg-secondary text-primary grid size-14 place-items-center rounded-2xl">
              <Newspaper className="size-6" aria-hidden="true" />
            </span>
            <h2 className="font-heading mt-6 text-xl font-semibold">
              {category
                ? "Sin noticias en esta categoría"
                : "Aún no hay noticias"}
            </h2>
            <p className="text-muted-foreground mt-2">
              Vuelve pronto para conocer las novedades.
            </p>
          </div>
        )}
      </Container>
    </>
  );
}

function CategoryChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/50",
      )}
    >
      {label}
    </Link>
  );
}
