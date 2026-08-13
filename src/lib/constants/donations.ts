/** Organización verificada para donaciones (lista curada por el equipo). */
export interface DonationOrg {
  name: string;
  /** Enlace para donar / sitio oficial. */
  url: string;
  /** Texto a mostrar del enlace (sin https://). */
  urlLabel: string;
  /** Usuario de Instagram (sin @). */
  instagram: string;
  description: string;
}

/**
 * Organizaciones verificadas a las que se puede donar para apoyar la causa.
 * Curada manualmente; verifica siempre en el sitio/Instagram oficial.
 */
export const DONATION_ORGS: DonationOrg[] = [];

/** Punto físico de acopio donde llevar la donación. */
export interface DonationDropoff {
  /** Nombre del punto (p. ej. la estación). */
  name: string;
  /** Dirección física. */
  address: string;
}

/** Campaña de acopio físico con varios puntos bajo una misma iniciativa. */
export interface DonationDrive {
  /** Ciudad / lugar de la campaña. */
  city: string;
  /** Usuarios de Instagram que la promueven (sin @). */
  instagram: string[];
  /** Descripción breve de la iniciativa. */
  description: string;
  /** Puntos donde se reciben las donaciones. */
  points: DonationDropoff[];
}

/**
 * Campañas de acopio físico (lleva tu donación a un punto). Curada a mano;
 * confirma siempre en el Instagram oficial de quien la promueve.
 */
export const DONATION_DRIVES: DonationDrive[] = [
  {
    city: "Bogotá",
    instagram: ["4patasrevista"],
    description:
      "Puntos de acopio de Laika. Verifica horarios, disponibilidad y qué elementos recibe cada punto antes de llevar tu donación.",
    points: [
      { name: "Calle 116", address: "Calle 116 #18B-43" },
      { name: "Chapinero", address: "Carrera 7 #59-34" },
      { name: "Modelia", address: "Calle 24 #74A-67" },
    ],
  },
  {
    city: "Cali",
    instagram: ["4patasrevista"],
    description:
      "Puntos de acopio de Laika. Verifica horarios, disponibilidad y qué elementos recibe cada punto antes de llevar tu donación.",
    points: [
      { name: "Capri", address: "Calle 13 #75-110" },
      { name: "Pance", address: "Calle 18 #127-120" },
    ],
  },
  {
    city: "Medellín",
    instagram: ["4patasrevista"],
    description:
      "Puntos de acopio de Laika. Verifica horarios, disponibilidad y qué elementos recibe cada punto antes de llevar tu donación.",
    points: [
      { name: "El Poblado", address: "Calle 2 Sur #32-54" },
      { name: "Llanogrande", address: "Km 7 vía Llanogrande" },
      {
        name: "Agua Bendita",
        address: "Sector Agua Bendita (confirma la dirección exacta)",
      },
    ],
  },
];
