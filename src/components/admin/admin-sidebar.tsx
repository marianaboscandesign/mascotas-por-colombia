"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clapperboard,
  HandHeart,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  ShieldCheck,
  Stethoscope,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";

import { signOutAdmin } from "@/app/admin/login/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  superAdminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/publicaciones", label: "Publicaciones", icon: Megaphone },
  { href: "/admin/refugios", label: "Centros de acopio", icon: Warehouse },
  { href: "/admin/veterinarios", label: "Veterinarios", icon: Stethoscope },
  {
    href: "/admin/vistas-en-redes",
    label: "Vistas en redes",
    icon: Clapperboard,
  },
  { href: "/admin/donaciones", label: "Donaciones", icon: HandHeart },
  { href: "/admin/voluntarios", label: "Voluntarios", icon: Users },
  { href: "/admin/contacto", label: "Mensajes de contacto", icon: Mail },
  {
    href: "/admin/moderadores",
    label: "Moderadores",
    icon: ShieldCheck,
    superAdminOnly: true,
  },
];

/** Marca activo el enlace exacto; para "/admin" evita marcar en subrutas. */
function useIsActive() {
  const pathname = usePathname();
  return React.useCallback(
    (href: string) =>
      href === "/admin"
        ? pathname === "/admin"
        : pathname === href || pathname.startsWith(href + "/"),
    [pathname],
  );
}

function NavLinks({
  role,
  onNavigate,
}: {
  role: string;
  onNavigate?: () => void;
}) {
  const isActive = useIsActive();
  return (
    <nav className="flex flex-col gap-1" aria-label="Secciones del panel">
      {NAV.filter((i) => !i.superAdminOnly || role === "super_admin").map(
        (item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-visible:ring-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        },
      )}
    </nav>
  );
}

function UserFooter({ name }: { name: string }) {
  return (
    <div className="border-border mt-auto border-t pt-4">
      <p className="text-muted-foreground truncate px-3 text-xs">Sesión de</p>
      <p className="truncate px-3 text-sm font-medium">{name}</p>
      <form action={signOutAdmin} className="mt-2 px-1">
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="w-full justify-start"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}

export function AdminSidebar({
  admin,
}: {
  admin: { full_name: string; role: string };
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* Escritorio: barra lateral fija */}
      <aside className="border-border bg-card hidden shrink-0 md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col md:border-r">
        <div className="flex h-full flex-col p-4">
          <Link
            href="/admin"
            className="font-heading mb-6 px-3 text-base font-bold"
          >
            Panel
          </Link>
          <NavLinks role={admin.role} />
          <UserFooter name={admin.full_name} />
        </div>
      </aside>

      {/* Móvil: barra superior con botón de menú */}
      <header className="border-border bg-card sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 md:hidden">
        <Link href="/admin" className="font-heading text-base font-bold">
          Panel
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="hover:bg-muted rounded-lg p-2"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Móvil: cajón deslizante */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="border-border bg-card absolute top-0 left-0 flex h-full w-72 max-w-[80vw] flex-col border-r p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-1">
              <span className="font-heading text-base font-bold">Panel</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="hover:bg-muted rounded-lg p-2"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavLinks role={admin.role} onNavigate={() => setOpen(false)} />
            <UserFooter name={admin.full_name} />
          </div>
        </div>
      )}
    </>
  );
}
