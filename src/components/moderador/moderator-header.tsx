import Link from "next/link";
import { LogOut } from "lucide-react";

import { signOutModerator } from "@/app/moderador/login/actions";
import { type ModeratorProfile } from "@/lib/auth/moderator";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Perdidas", href: "/moderador/mascotas?tipo=perdida" },
  { label: "Encontradas", href: "/moderador/mascotas?tipo=encontrada" },
  { label: "Refugios", href: "/moderador/refugios" },
  { label: "Centros de acopio", href: "/moderador/acopio" },
  { label: "Voluntarios", href: "/moderador/voluntarios" },
  {
    label: "Reportes pendientes",
    href: "/moderador/mascotas?filtro=pendientes",
  },
];

export function ModeratorHeader({ admin }: { admin: ModeratorProfile }) {
  return (
    <div className="border-border bg-card border-b">
      <Container className="flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-5 overflow-x-auto">
          <Link
            href="/moderador"
            className="font-heading text-sm font-semibold whitespace-nowrap"
          >
            Moderación
          </Link>
          <nav
            className="flex items-center gap-4 text-sm whitespace-nowrap"
            aria-label="Panel de moderación"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground hidden sm:inline">
            {admin.full_name}
          </span>
          <form action={signOutModerator}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="size-4" />
              Salir
            </Button>
          </form>
        </div>
      </Container>
    </div>
  );
}
