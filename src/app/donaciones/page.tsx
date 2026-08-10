import type { Metadata } from "next";
import { ExternalLink, HandHeart, Instagram, MapPin } from "lucide-react";

import { DONATION_DRIVES, DONATION_ORGS } from "@/lib/constants/donations";
import { getDonationOrgs } from "@/lib/data/donations";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = {
  alternates: { canonical: "/donaciones" },
  title: "Donaciones — Organizaciones verificadas",
  description:
    "Organizaciones verificadas a las que puedes donar para ayudar a las mascotas y comunidades de Colombia.",
};

// ISR: se regenera cada 10 min y bajo demanda cuando el admin edita (las
// acciones de /admin/donaciones llaman revalidatePath("/donaciones")).
export const revalidate = 600;

export default async function DonationsPage() {
  // Lee de la BD (gestionable por admin); si aún no hay tabla/registros, usa la
  // lista estática como respaldo para no dejar la página vacía.
  const dbOrgs = await getDonationOrgs();
  const orgs = dbOrgs.length > 0 ? dbOrgs : DONATION_ORGS;

  return (
    <>
      <PageHeader
        eyebrow="Cómo ayudar"
        title="Donaciones"
        description="Organizaciones verificadas a las que puedes donar para apoyar la causa. Verifica siempre en su sitio o Instagram oficial antes de donar."
      />
      <Container className="py-10 lg:py-14">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <li key={org.name}>
              <article className="border-border bg-card flex h-full flex-col rounded-2xl border p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="bg-secondary text-primary grid size-11 shrink-0 place-items-center rounded-xl">
                    <HandHeart className="size-5" aria-hidden="true" />
                  </span>
                  <h2 className="font-heading mt-1 text-lg font-semibold">
                    {org.name}
                  </h2>
                </div>

                <p className="text-muted-foreground mt-3 flex-1 text-sm">
                  {org.description}
                </p>

                <div className="mt-5 flex flex-col gap-2">
                  <a
                    href={org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Donar
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                  <a
                    href={`https://www.instagram.com/${org.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border text-foreground hover:bg-secondary inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                  >
                    <Instagram className="size-4" aria-hidden="true" />@
                    {org.instagram}
                  </a>
                </div>

                <p className="text-muted-foreground mt-3 truncate text-xs">
                  {org.urlLabel}
                </p>
              </article>
            </li>
          ))}
        </ul>

        {DONATION_DRIVES.map((drive) => (
          <section key={drive.city} className="mt-14">
            <h2 className="font-heading text-2xl font-bold">
              Puntos de acopio en {drive.city}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
              {drive.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {drive.instagram.map((ig) => (
                <a
                  key={ig}
                  href={`https://www.instagram.com/${ig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border text-foreground hover:bg-secondary inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                >
                  <Instagram className="size-4" aria-hidden="true" />@{ig}
                </a>
              ))}
            </div>

            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {drive.points.map((point) => (
                <li key={point.name}>
                  <article className="border-border bg-card flex h-full flex-col rounded-2xl border p-5 shadow-sm">
                    <span className="bg-secondary text-primary grid size-11 shrink-0 place-items-center rounded-xl">
                      <MapPin className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="font-heading mt-3 text-base font-semibold">
                      {point.name}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {point.address}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="text-muted-foreground mt-8 text-center text-xs">
          Esta lista es referencial. Confirma siempre los datos en el sitio o
          Instagram oficial de cada organización antes de donar.
        </p>
      </Container>
    </>
  );
}
