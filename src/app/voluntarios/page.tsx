import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, Users } from "lucide-react";

import { getPublicVolunteers } from "@/lib/data/volunteers";
import {
  VOLUNTEER_ROLES,
  VOLUNTEER_ROLE_VALUES,
} from "@/lib/constants/volunteers";
import { routes } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { VolunteerCard } from "@/components/volunteers/volunteer-card";

export const metadata: Metadata = {
  alternates: { canonical: "/voluntarios" },
  title: "Voluntarios",
  description:
    "Directorio de voluntarios disponibles para ayudar a las mascotas de Colombia. Refugios y fundaciones pueden contactarlos directamente.",
};

interface PageProps {
  searchParams: Promise<{ rol?: string }>;
}

function parseRole(v?: string): string | undefined {
  return v && VOLUNTEER_ROLE_VALUES.includes(v) ? v : undefined;
}

export default async function VolunteersDirectoryPage({
  searchParams,
}: PageProps) {
  const { rol } = await searchParams;
  const role = parseRole(rol);
  const volunteers = await getPublicVolunteers(role);

  return (
    <>
      <PageHeader
        eyebrow="Red de apoyo"
        title="Voluntarios"
        description="Personas dispuestas a ayudar: veterinarios, transportistas, casas temporales, rescatistas y más. Refugios y fundaciones pueden contactarlos directamente."
      />
      <Container className="py-10 lg:py-14">
        <div className="border-warm/30 bg-warm-soft/40 mb-8 flex flex-col items-start gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <span className="font-medium">¿Quieres ayudar?</span> Regístrate y
            elige si deseas aparecer en este directorio.
          </p>
          <Button asChild variant="warm" size="sm">
            <Link href={`${routes.volunteers}/unirse`}>
              <HeartHandshake aria-hidden="true" />
              Hazte voluntario
            </Link>
          </Button>
        </div>

        {/* Filtro por rol */}
        <div className="mb-8 flex flex-wrap gap-2">
          <FilterChip label="Todos" href={routes.volunteers} active={!role} />
          {VOLUNTEER_ROLES.map((r) => (
            <FilterChip
              key={r.value}
              label={r.label}
              href={`${routes.volunteers}?rol=${r.value}`}
              active={role === r.value}
            />
          ))}
        </div>

        {volunteers.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {volunteers.map((volunteer) => (
              <li key={volunteer.id}>
                <VolunteerCard volunteer={volunteer} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
            <span className="bg-secondary text-primary grid size-14 place-items-center rounded-2xl">
              <Users className="size-6" aria-hidden="true" />
            </span>
            <h2 className="font-heading mt-6 text-xl font-semibold">
              {role
                ? "Ningún voluntario con ese rol todavía"
                : "Aún no hay voluntarios en el directorio"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {role
                ? "Prueba con otro rol o mira todos los voluntarios."
                : "Sé el primero en sumarte y aparecer aquí para que los refugios te contacten."}
            </p>
            <Button asChild className="mt-6">
              <Link href={`${routes.volunteers}/unirse`}>Hazte voluntario</Link>
            </Button>
          </div>
        )}
      </Container>
    </>
  );
}

function FilterChip({
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
        "focus-visible:ring-ring rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
