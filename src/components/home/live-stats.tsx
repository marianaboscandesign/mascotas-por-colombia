"use client";

import * as React from "react";
import Link from "next/link";

import { routes } from "@/config/navigation";
import { EMPTY_HOME_STATS, type HomeStats } from "@/lib/stats/home";

const CIFRAS = [
  { key: "lost", label: "Mascotas perdidas", href: routes.pets, suffix: "" },
  {
    key: "found",
    label: "Mascotas encontradas",
    href: routes.foundPets,
    suffix: "",
  },
  {
    key: "reunited",
    label: "Reencuentros",
    href: routes.successStories,
    suffix: "",
  },
] as const satisfies ReadonlyArray<{
  key: keyof HomeStats;
  label: string;
  href: string;
  suffix: string;
}>;

/**
 * Cifras del Home en tiempo real: parte del valor calculado en el servidor y lo
 * refresca desde el navegador al montar y cada 30 s (conteos públicos), de modo
 * que siempre muestre datos actualizados.
 */
export function LiveStats({ initial }: { initial: HomeStats }) {
  const [stats, setStats] = React.useState<HomeStats>(initial);

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/home-stats");
        if (!res.ok) return;
        const next = (await res.json()) as HomeStats;
        if (active) setStats(next);
      } catch {
        if (active) setStats((prev) => prev ?? EMPTY_HOME_STATS);
      }
    }

    load();
    const id = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <dl className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-6">
      {CIFRAS.map((c) => (
        <Link
          key={c.key}
          href={c.href}
          className="focus-visible:ring-ring group rounded-2xl text-center focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <dd className="text-primary font-heading text-4xl font-bold tabular-nums sm:text-5xl">
            {stats[c.key].toLocaleString("es-CO")}
            {c.suffix}
          </dd>
          <dt className="text-muted-foreground group-hover:text-foreground mt-2 text-sm font-medium transition-colors">
            {c.label}
          </dt>
        </Link>
      ))}
    </dl>
  );
}
