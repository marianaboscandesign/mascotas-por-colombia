"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

import { helpNav } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/layout/nav-link";

/**
 * Menú desplegable "Ayuda" del header (escritorio). Agrupa los enlaces
 * secundarios para no saturar la barra. Se abre al pasar el cursor o al
 * hacer clic, y se cierra con Escape, clic afuera o al cambiar de ruta.
 */
export function HelpMenu() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = helpNav.some(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium transition-colors",
          active
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Ayuda
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 z-50 -translate-x-1/2 pt-3">
          <div className="border-border bg-card min-w-56 rounded-xl border p-1.5 shadow-lg">
            {helpNav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                onNavigate={() => setOpen(false)}
                className="hover:bg-secondary block rounded-lg px-3 py-2"
              >
                {item.title}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
