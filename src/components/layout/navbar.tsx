import Link from "next/link";
import { Search } from "lucide-react";

import { ctaNav, mainNav, routes } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/common/logo";
import { NavLink } from "@/components/layout/nav-link";
import { HelpMenu } from "@/components/layout/help-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * Cabecera principal del sitio: marca, navegación y llamadas a la acción.
 * Sticky, con borde sutil y fondo translúcido (estilo limpio y moderno).
 */
export function Navbar() {
  return (
    <header className="border-border/80 bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 w-full border-b backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo />

          <nav
            className="hidden items-center gap-6 xl:flex"
            aria-label="Principal"
          >
            {mainNav.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.title}
              </NavLink>
            ))}
            <HelpMenu />
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />

            <div className="hidden items-center gap-3 xl:flex">
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="Buscar mascotas"
              >
                <Link href={routes.search}>
                  <Search />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={ctaNav.reportFound.href}>
                  {ctaNav.reportFound.title}
                </Link>
              </Button>
              <Button asChild variant="warm" size="sm">
                <Link href={ctaNav.reportLost.href}>
                  {ctaNav.reportLost.title}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}
