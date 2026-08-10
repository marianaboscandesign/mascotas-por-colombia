import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";

import { siteConfig } from "@/config/site";
import { routes } from "@/config/navigation";
import { getHeroBySlug, RESCUE_HEROES } from "@/lib/constants/heroes";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export function generateStaticParams() {
  return RESCUE_HEROES.map((hero) => ({ slug: hero.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hero = getHeroBySlug(slug);
  if (!hero) return {};

  const url = `/heroes-caninos/${hero.slug}`;
  return {
    title: { absolute: hero.seoTitle },
    description: hero.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: hero.seoTitle,
      description: hero.metaDescription,
      url,
      type: "article",
      images: [{ url: hero.photo, width: 1080, height: 1080, alt: hero.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: hero.seoTitle,
      description: hero.metaDescription,
      images: [hero.photo],
    },
  };
}

export default async function HeroDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hero = getHeroBySlug(slug);
  if (!hero) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: hero.seoTitle,
    description: hero.metaDescription,
    image: `${siteConfig.url}${hero.photo}`,
    about: `${hero.name}, perro rescatista de ${hero.country}`,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntityOfPage: `${siteConfig.url}/heroes-caninos/${hero.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container className="py-8 lg:py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link href={routes.heroes}>
            <ArrowLeft className="size-4" />
            Volver a Héroes Caninos
          </Link>
        </Button>

        <article className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="border-border bg-muted relative aspect-square w-full overflow-hidden rounded-3xl border shadow-sm">
            <Image
              src={hero.photo}
              alt={hero.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-primary font-heading text-sm font-semibold tracking-wide uppercase">
              Héroe canino
            </p>
            <h1 className="font-heading mt-2 text-4xl font-bold sm:text-5xl">
              {hero.name}
            </h1>
            <p className="text-muted-foreground mt-3 flex items-center gap-2 text-lg">
              <span className="text-2xl" aria-hidden="true">
                {hero.flag}
              </span>
              Perro rescatista de {hero.country}
            </p>

            <div className="border-warm/30 bg-warm-soft/40 text-foreground mt-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
              <MapPin
                className="text-warm size-4 shrink-0"
                aria-hidden="true"
              />
              Búsqueda y rescate tras los terremotos en Colombia (2026)
            </div>

            <p className="text-muted-foreground mt-6 leading-relaxed">
              {hero.story}
            </p>
          </div>
        </article>

        {/* Otros héroes */}
        <section className="mt-14">
          <h2 className="font-heading text-2xl font-bold">Otros héroes</h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {RESCUE_HEROES.filter((h) => h.slug !== hero.slug)
              .slice(0, 4)
              .map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/heroes-caninos/${other.slug}`}
                    className="group focus-visible:ring-ring border-border bg-card block overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <div className="bg-muted relative aspect-square w-full overflow-hidden">
                      <Image
                        src={other.photo}
                        alt={other.alt}
                        fill
                        sizes="(max-width: 640px) 50vw, 220px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3">
                      <span aria-hidden="true">{other.flag}</span>
                      <span className="font-heading text-sm font-semibold">
                        {other.name}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      </Container>
    </>
  );
}
