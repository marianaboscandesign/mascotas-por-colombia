import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PawPrint } from "lucide-react";

import { siteConfig } from "@/config/site";
import { RESCUE_HEROES } from "@/lib/constants/heroes";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = {
  alternates: { canonical: "/heroes-caninos" },
  title: "Héroes Caninos | Perros Rescatistas del Terremoto en Colombia",
  description:
    "Homenaje a los perros rescatistas que vinieron de toda la región a las labores de búsqueda y rescate tras los terremotos en Colombia. Conoce a cada héroe canino.",
  openGraph: {
    title: "Héroes Caninos | Perros Rescatistas del Terremoto en Colombia",
    description:
      "Homenaje a los perros rescatistas que participaron en la búsqueda y rescate tras los terremotos en Colombia.",
    url: "/heroes-caninos",
  },
};

export default function HeroesCaninosPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Héroes Caninos del Terremoto en Colombia",
    itemListElement: RESCUE_HEROES.map((hero, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteConfig.url}/heroes-caninos/${hero.slug}`,
      name: `${hero.name} — perro rescatista de ${hero.country}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        eyebrow="Homenaje"
        title="Héroes Caninos"
        description="Perros rescatistas que vinieron de toda la región a las labores de búsqueda y rescate tras los terremotos en Colombia. Conoce su historia y dales las gracias."
      />

      <Container className="py-10 lg:py-14">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {RESCUE_HEROES.map((hero) => (
            <li key={hero.slug}>
              <Link
                href={`/heroes-caninos/${hero.slug}`}
                className="group focus-visible:ring-ring border-border bg-card block overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <div className="bg-muted relative aspect-square w-full overflow-hidden">
                  <Image
                    src={hero.photo}
                    alt={hero.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">
                      {hero.flag}
                    </span>
                    <h2 className="font-heading text-lg font-semibold">
                      {hero.name}
                    </h2>
                    <span className="text-muted-foreground text-sm">
                      · {hero.country}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {hero.summary}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="border-warm/30 bg-warm-soft/50 mt-10 flex flex-col items-center gap-3 rounded-3xl border px-6 py-10 text-center">
          <span className="bg-warm/15 text-warm grid size-14 place-items-center rounded-2xl">
            <PawPrint className="size-7" aria-hidden="true" />
          </span>
          <h2 className="font-heading text-xl font-bold text-balance sm:text-2xl">
            ¡Gracias a todos los rescatistas y sus perros de rescate!
          </h2>
          <p className="text-muted-foreground max-w-xl text-pretty">
            A cada equipo que vino a Colombia a ayudar en esta labor tan
            heroica: gracias por su valentía y su entrega.
          </p>
        </div>
      </Container>
    </>
  );
}
