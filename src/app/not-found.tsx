import type { Metadata } from "next";
import Link from "next/link";

import { routes } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description:
    "La página que buscas no existe o fue movida. Vuelve al inicio de Mascotas por Colombia y ayúdanos a reunir a las mascotas con sus familias.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-heading text-primary text-sm font-semibold tracking-wide uppercase">
        Error 404
      </p>

      <LostPetsIllustration />

      <h1 className="mt-2 text-2xl font-bold text-balance sm:text-3xl">
        Ups… parece que esta mascota se perdió en el camino.
      </h1>
      <p className="text-muted-foreground mt-4 max-w-md text-pretty">
        La página que buscas no existe o fue movida. Ayudémosla a encontrar el
        camino de regreso.
      </p>

      <Button asChild size="lg" variant="warm" className="mt-8">
        <Link href={routes.home}>Volver al inicio</Link>
      </Button>
    </Container>
  );
}

/**
 * Ilustración vectorial original (SVG) de un perrito (naranja) y un gatito
 * (turquesa) buscando el camino de regreso, con un rastro de huellas punteado
 * que baja hacia el botón. Usa los colores de marca y se adapta al tema.
 * Animaciones sutiles vía clases en globals.css (cola del perro + huellas),
 * desactivadas con prefers-reduced-motion.
 */
function LostPetsIllustration() {
  return (
    <svg
      viewBox="0 0 360 300"
      className="mt-6 h-auto w-full max-w-[20rem] sm:max-w-sm"
      role="img"
      aria-label="Un perrito y un gatito buscando el camino de regreso a casa"
    >
      {/* Suelo */}
      <ellipse cx="180" cy="206" rx="150" ry="18" className="fill-secondary" />

      {/* ── Perro (naranja), a la izquierda ── */}
      <g>
        {/* Cola (animada) */}
        <path
          className="fill-warm nf-tail"
          d="M86 178c-18-2-30-12-38-30 16 4 30 10 40 20 5 5 4 9-2 10z"
        />
        {/* Cuerpo */}
        <path
          className="fill-warm"
          d="M92 204c-8-46 14-72 42-72s50 26 42 72c-26 8-58 8-84 0z"
        />
        {/* Pecho claro */}
        <ellipse cx="134" cy="188" rx="22" ry="20" className="fill-warm-soft" />
        {/* Cabeza */}
        <circle cx="134" cy="132" r="30" className="fill-warm" />
        {/* Orejas caídas */}
        <path
          className="fill-warm"
          d="M108 116c-13 3-17 18-12 38 12-3 19-14 21-30z"
        />
        <path
          className="fill-warm"
          d="M160 116c13 3 17 18 12 38-12-3-19-14-21-30z"
        />
        {/* Hocico */}
        <ellipse cx="134" cy="146" rx="15" ry="12" className="fill-warm-soft" />
        {/* Nariz */}
        <circle cx="134" cy="141" r="4.5" className="fill-foreground" />
        {/* Ojos */}
        <circle cx="123" cy="127" r="3.4" className="fill-foreground" />
        <circle cx="145" cy="127" r="3.4" className="fill-foreground" />
      </g>

      {/* ── Gato (turquesa), a la derecha ── */}
      <g>
        {/* Cola */}
        <path
          className="fill-primary"
          d="M238 198c34 6 46-12 40-46-9-2-15 6-15 24 0 16-10 24-25 17z"
        />
        {/* Cuerpo */}
        <path
          className="fill-primary"
          d="M198 204c-6-40 12-58 32-58s38 18 32 58c-20 7-44 7-64 0z"
        />
        {/* Pecho claro */}
        <ellipse cx="230" cy="190" rx="15" ry="14" className="fill-secondary" />
        {/* Cabeza */}
        <circle cx="230" cy="152" r="23" className="fill-primary" />
        {/* Orejas (triángulos) */}
        <path className="fill-primary" d="M214 138l-7-22 20 11z" />
        <path className="fill-primary" d="M246 138l7-22-20 11z" />
        {/* Ojos */}
        <circle cx="222" cy="150" r="3" className="fill-foreground" />
        <circle cx="238" cy="150" r="3" className="fill-foreground" />
        {/* Nariz */}
        <path className="fill-warm" d="M227 158h6l-3 4z" />
        {/* Bigotes */}
        <g className="stroke-foreground/40" strokeWidth="1.2" fill="none">
          <path d="M218 159l-16-3M218 162l-16 2M242 159l16-3M242 162l16 2" />
        </g>
      </g>

      {/* ── Rastro de huellas punteado hacia el botón ── */}
      <path
        d="M180 230c-40 16-30 40 6 50s40 26 0 38"
        fill="none"
        className="stroke-primary/30"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 13"
      />
      <Paw x={150} y={244} delay="0s" />
      <Paw x={198} y={270} delay="0.45s" />
      <Paw x={158} y={294} delay="0.9s" />
    </svg>
  );
}

/** Huella (pata) con animación de aparición escalonada. */
function Paw({ x, y, delay }: { x: number; y: number; delay: string }) {
  return (
    <g
      className="fill-warm nf-paw"
      transform={`translate(${x} ${y})`}
      style={{ animationDelay: delay }}
    >
      <ellipse cx="0" cy="2.5" rx="5" ry="4" />
      <circle cx="-5" cy="-3.5" r="1.9" />
      <circle cx="0" cy="-6" r="1.9" />
      <circle cx="5" cy="-3.5" r="1.9" />
    </g>
  );
}
