"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Interruptor de tema claro/oscuro. Alterna la clase `.dark` en <html> (que
 * activa los tokens de color oscuros de globals.css) y guarda la preferencia
 * en localStorage. El icono se intercambia por CSS según la clase `.dark`,
 * así no hay desajuste de hidratación.
 */
export function ThemeToggle() {
  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      /* almacenamiento no disponible: se ignora */
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Cambiar entre modo claro y oscuro"
      title="Cambiar tema"
    >
      <Sun className="hidden size-5 dark:block" aria-hidden="true" />
      <Moon className="size-5 dark:hidden" aria-hidden="true" />
    </Button>
  );
}
