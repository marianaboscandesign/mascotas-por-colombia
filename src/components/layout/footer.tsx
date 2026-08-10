import Link from "next/link";
import { Instagram } from "lucide-react";

import { siteConfig } from "@/config/site";
import { footerNav, routes } from "@/config/navigation";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/common/logo";

/** Pie de página con la marca y navegación secundaria. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-muted/40 border-t">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              {siteConfig.description}
            </p>
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border bg-card hover:border-primary/50 inline-flex w-fit items-center gap-3 rounded-xl border p-3 shadow-sm transition-colors hover:shadow-md"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white">
                <Instagram className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="text-foreground block text-sm font-semibold">
                  Síguenos en Instagram
                </span>
                <span className="text-muted-foreground block text-sm">
                  {siteConfig.social.instagramHandle}
                </span>
              </span>
            </a>
          </div>

          {footerNav.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="font-heading text-foreground text-sm font-semibold">
                {group.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-border text-muted-foreground mt-12 flex flex-col gap-3 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. Hecho con cariño para Colombia.
          </p>
          <Link
            href={routes.safety}
            className="hover:text-foreground transition-colors"
          >
            Aviso de seguridad y términos
          </Link>
        </div>
      </Container>
    </footer>
  );
}
