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
export const DONATION_DRIVES: DonationDrive[] = [];
