/**
 * Definición central del sistema de rutas y navegación.
 * Reutilizado por Navbar, Footer y mapa del sitio.
 */

export interface NavItem {
  title: string;
  href: string;
  description?: string;
}

/** Rutas de la aplicación (fuente única para enlaces internos). */
export const routes = {
  home: "/",
  search: "/buscar",
  pets: "/mascotas",
  foundPets: "/found-pets",
  shelters: "/refugios",
  shelterRegister: "/refugios/registrar",
  freeVets: "/veterinarios-gratuitos",
  socialPets: "/vistas-en-redes",
  donations: "/donaciones",
  volunteers: "/voluntarios",
  volunteerJoin: "/voluntarios/unirse",
  map: "/mapa",
  successStories: "/success-stories",
  heroes: "/heroes-caninos",
  contact: "/contacto",
  safety: "/aviso",
  reportLost: "/reportar/perdida",
  reportFound: "/found-pets/reportar",
} as const;

/** Navegación principal del header (enlaces de primer nivel). */
export const mainNav: NavItem[] = [
  { title: "Perdidas", href: routes.pets },
  { title: "Encontradas", href: routes.foundPets },
];

/** Enlaces agrupados bajo el menú "Ayuda" del header. */
export const helpNav: NavItem[] = [
  { title: "Acopio y Refugios", href: routes.shelters },
  { title: "Veterinarios gratuitos", href: routes.freeVets },
  { title: "Donaciones", href: routes.donations },
  { title: "Vistas en redes", href: routes.socialPets },
  { title: "Héroes Caninos", href: routes.heroes },
];

/** Enlaces destacados de llamada a la acción. */
export const ctaNav = {
  reportLost: { title: "Reportar perdida", href: routes.reportLost },
  reportFound: { title: "Encontré una mascota", href: routes.reportFound },
} as const;

/** Estructura del footer agrupada por columnas. */
export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Plataforma",
    items: [
      { title: "Mapa", href: routes.map },
      { title: "Mascotas perdidas", href: routes.pets },
      { title: "Mascotas encontradas", href: routes.foundPets },
      { title: "Historias de reencuentro", href: routes.successStories },
      { title: "Centros de Acopio y Refugios", href: routes.shelters },
      { title: "Veterinarios gratuitos", href: routes.freeVets },
      { title: "Donaciones", href: routes.donations },
      { title: "Vistas en redes", href: routes.socialPets },
      { title: "Reportar perdida", href: routes.reportLost },
      { title: "Reportar encontrada", href: routes.reportFound },
    ],
  },
];
