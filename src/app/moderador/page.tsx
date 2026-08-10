import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Heart, PawPrint, Search } from "lucide-react";

import { requireModerator } from "@/lib/auth/moderator";
import { getActivityLog } from "@/lib/data/activity-log";
import { formatDate } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { ModeratorHeader } from "@/components/moderador/moderator-header";

export const metadata: Metadata = {
  title: "Panel de moderación",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const LINKS = [
  {
    href: "/moderador/mascotas?tipo=perdida",
    icon: Search,
    title: "Mascotas perdidas",
    desc: "Revisa y edita los reportes de mascotas perdidas.",
  },
  {
    href: "/moderador/mascotas?tipo=encontrada",
    icon: PawPrint,
    title: "Mascotas encontradas",
    desc: "Revisa y edita los reportes de mascotas encontradas.",
  },
  {
    href: "/moderador/mascotas?filtro=pendientes",
    icon: ClipboardList,
    title: "Reportes pendientes",
    desc: "Reportes por revisar o publicaciones ocultas.",
  },
];

export default async function ModeratorDashboard() {
  const mod = await requireModerator();
  const activity = await getActivityLog(12);

  return (
    <>
      <ModeratorHeader admin={mod} />
      <Container className="py-10">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Hola, {mod.full_name.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Ayúdanos a mantener la plataforma al día. Gracias por tu tiempo.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LINKS.map(({ href, icon: Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group focus-visible:ring-ring border-border bg-card rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span className="bg-secondary text-primary grid size-11 place-items-center rounded-xl">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="font-heading mt-4 text-lg font-semibold">
                {title}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">{desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="font-heading flex items-center gap-2 text-lg font-semibold">
            <Heart className="text-primary size-5" aria-hidden="true" />
            Actividad reciente
          </h2>
          {activity.length === 0 ? (
            <p className="text-muted-foreground border-border bg-muted/30 mt-4 rounded-xl border p-6 text-center text-sm">
              Aún no hay actividad registrada.
            </p>
          ) : (
            <ul className="border-border mt-4 divide-y rounded-2xl border">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                >
                  <span>{a.summary}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatDate(a.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </>
  );
}
