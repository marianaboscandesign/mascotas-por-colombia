import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeartHandshake, MapPin, Search, ShieldCheck } from "lucide-react";

import { ctaNav, routes } from "@/config/navigation";
import { getLatestSuccessStories } from "@/lib/data/success-stories";
import { getActiveLostPets } from "@/lib/data/lost-pets";
import { getFoundPets } from "@/lib/data/found-pets";
import { getHomeStats } from "@/lib/data/home-stats";
import { getShelters } from "@/lib/data/shelters";
import { getFreeVetServices } from "@/lib/data/free-vets";
import { getSocialPets } from "@/lib/data/social-pets";
import { getRecentTopMatches } from "@/lib/data/pet-matches";
import { RESCUE_HEROES } from "@/lib/constants/heroes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/common/section";
import { StoryCard } from "@/components/success/story-card";
import { LostPetCard } from "@/components/lost-pets/lost-pet-card";
import { FoundPetCard } from "@/components/found-pets/found-pet-card";
import { ShelterCard } from "@/components/shelters/shelter-card";
import { FreeVetCard } from "@/components/vets/free-vet-card";
import { SocialPetCard } from "@/components/social/social-pet-card";
import { GlobalSearch } from "@/components/search/global-search";
import { PhotoSearch } from "@/components/matches/photo-search";
import { HomeMatches } from "@/components/matches/home-matches";
import { LiveStats } from "@/components/home/live-stats";

// ISR: el home se sirve desde caché (no ejecuta función en cada visita, lo que
// reduce el Fluid Active CPU de Vercel). Se regenera cada 5 min y, al instante,
// cuando se mutan mascotas u otro contenido (las server actions llaman
// bustPets/bust → revalidateTag, que también invalida esta página). El contador
// "en vivo" sigue actualizándose en el cliente (LiveStats).
export const revalidate = 300;

const HOME_DESCRIPTION =
  "Plataforma gratuita para reportar mascotas perdidas y encontradas, apoyar refugios, centros de acopio y voluntarios en Colombia.";

export const metadata: Metadata = {
  title: {
    absolute:
      "Mascotas por Colombia | Reúne mascotas perdidas con sus familias",
  },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Mascotas por Colombia | Reúne mascotas perdidas con sus familias",
    description: HOME_DESCRIPTION,
    url: "/",
  },
  twitter: {
    title: "Mascotas por Colombia | Reúne mascotas perdidas con sus familias",
    description: HOME_DESCRIPTION,
  },
};

const valores = [
  {
    icon: Search,
    title: "Busca y encuentra",
    description:
      "Explora reportes de mascotas perdidas y encontradas con filtros claros por zona, especie y estado.",
  },
  {
    icon: MapPin,
    title: "Cerca de ti",
    description:
      "Organizamos la información por estado y sector para que la búsqueda sea rápida y local.",
  },
  {
    icon: ShieldCheck,
    title: "Con confianza",
    description:
      "Datos de contacto protegidos y reportes verificables para reencuentros seguros.",
  },
  {
    icon: HeartHandshake,
    title: "En comunidad",
    description:
      "Una red solidaria de voluntarios y familias trabajando para que cada mascota vuelva a casa.",
  },
];

export default async function HomePage() {
  const [
    stories,
    lostPetsResult,
    foundPetsResult,
    stats,
    shelters,
    freeVets,
    socialPets,
    matchPairs,
  ] = await Promise.all([
    getLatestSuccessStories(6),
    getActiveLostPets(6),
    getFoundPets(),
    getHomeStats(),
    getShelters(),
    getFreeVetServices(),
    getSocialPets(),
    getRecentTopMatches(6),
  ]);
  const lostPets = lostPetsResult.items;
  const latestFound = foundPetsResult.items.slice(0, 6);
  const featuredShelters = shelters.slice(0, 6);
  const featuredVets = freeVets.slice(0, 6);
  const featuredSocialPets = socialPets.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="from-secondary/60 via-background to-background pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b"
        />
        <Container className="py-10 lg:py-24">
          <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
            {/* Texto */}
            <div className="text-center lg:text-left">
              <Badge variant="warm" className="mb-4 lg:mb-6">
                Respuesta solidaria al terremoto
              </Badge>
              <h1 className="text-4xl font-bold text-balance sm:text-5xl lg:text-6xl">
                Ayudemos a las mascotas de Colombia a{" "}
                <span className="text-primary">volver a casa</span>
              </h1>
              <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-pretty lg:mx-0 lg:mt-6">
                Una plataforma para reunir a las mascotas perdidas con sus
                familias tras el terremoto. Reporta, busca y comparte: cada
                reencuentro empieza con un gesto de esperanza.
              </p>
              <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:mt-8 lg:justify-start">
                <Button asChild size="lg" variant="warm">
                  <Link href={ctaNav.reportLost.href}>
                    Reportar mascota perdida
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={ctaNav.reportFound.href}>
                    Reportar mascota encontrada
                  </Link>
                </Button>
              </div>
            </div>

            {/* Imagen */}
            <div className="order-last">
              <Image
                src="/hero-mascotas.webp"
                alt="Un perro y un gato sobre el mapa de Colombia"
                width={900}
                height={900}
                priority
                sizes="(max-width: 1024px) 16rem, 40vw"
                className="mx-auto h-auto w-full max-w-[13rem] sm:max-w-xs lg:max-w-xl"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Mascotas perdidas */}
      {lostPets.length > 0 && (
        <Section className="pt-0">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Mascotas perdidas
              </h2>
              <p className="text-muted-foreground mt-2">
                Reportadas por sus familias. Si has visto alguna, ayúdala a
                volver a casa.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={routes.pets}>Ver todas</Link>
            </Button>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lostPets.map((pet) => (
              <li key={pet.id}>
                <LostPetCard pet={pet} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Mascotas encontradas */}
      {latestFound.length > 0 && (
        <Section className="pt-0">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Mascotas encontradas
              </h2>
              <p className="text-muted-foreground mt-2">
                Mascotas a salvo que buscan a su familia. ¿Reconoces a alguna?
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={routes.foundPets}>Ver todas</Link>
            </Button>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latestFound.map((pet) => (
              <li key={pet.id}>
                <FoundPetCard pet={pet} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Posibles coincidencias (IA) */}
      <HomeMatches pairs={matchPairs} />

      {/* Vistas en redes */}
      {featuredSocialPets.length > 0 && (
        <Section className="pt-0">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Vistas en redes
              </h2>
              <p className="text-muted-foreground mt-2">
                Videos de TikTok e Instagram que necesitan difusión: mascotas
                que buscan a su familia, refugios y causas que piden ayuda.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={routes.socialPets}>Ver todas</Link>
            </Button>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredSocialPets.map((pet) => (
              <li key={pet.id}>
                <SocialPetCard pet={pet} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Reencuentros */}
      {stories.length > 0 && (
        <Section className="pt-0">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Reencuentros que nos llenan de esperanza
              </h2>
              <p className="text-muted-foreground mt-2">
                Mascotas que ya volvieron con su familia gracias a la comunidad.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={routes.successStories}>Ver todas las historias</Link>
            </Button>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <li key={`${story.kind}-${story.id}`}>
                <StoryCard story={story} compact />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Héroes Caninos */}
      {RESCUE_HEROES.length > 0 && (
        <Section className="pt-0">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Héroes Caninos</h2>
            <p className="text-muted-foreground mt-2">
              Perros rescatistas que vinieron a ayudar en la búsqueda y rescate
              tras los terremotos. Conoce su historia y dales las gracias.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={routes.heroes}>Ver todos</Link>
          </Button>
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {RESCUE_HEROES.slice(0, 4).map((hero) => (
            <li key={hero.slug}>
              <Link
                href={`/heroes-caninos/${hero.slug}`}
                className="group focus-visible:ring-ring border-border bg-card block overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <div className="bg-muted relative aspect-square w-full overflow-hidden">
                  <Image
                    src={hero.photo}
                    alt={hero.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, 260px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center gap-2 p-4">
                  <span aria-hidden="true">{hero.flag}</span>
                  <span className="font-heading text-sm font-semibold">
                    {hero.name}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    · {hero.country}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        </Section>
      )}

      {/* Veterinarios gratuitos */}
      {featuredVets.length > 0 && (
        <Section className="pt-0">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Veterinarios gratuitos
              </h2>
              <p className="text-muted-foreground mt-2">
                Jornadas y servicios veterinarios gratuitos para las mascotas.
                Mira las sedes y cómo contactarlos.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={routes.freeVets}>Ver todos</Link>
            </Button>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredVets.map((vet) => (
              <li key={vet.id}>
                <FreeVetCard vet={vet} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Centros de acopio y refugios */}
      {featuredShelters.length > 0 && (
        <Section className="pt-0">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Centros de Acopio y Refugios
              </h2>
              <p className="text-muted-foreground mt-2">
                Organizaciones que cuidan y rescatan mascotas. Mira qué
                necesitan y cómo ayudarlas.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={routes.shelters}>Ver todos</Link>
            </Button>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredShelters.map((shelter) => (
              <li key={shelter.id}>
                <ShelterCard shelter={shelter} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Llamado final */}
      <Section className="pt-0">
        <div className="bg-primary text-primary-foreground overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12 lg:py-16">
          <h2 className="text-2xl font-bold text-balance sm:text-3xl">
            ¿Encontraste una mascota? Tu reporte puede cambiar una historia.
          </h2>
          <p className="text-primary-foreground/85 mx-auto mt-3 max-w-xl text-pretty">
            Comparte lo que viste. En minutos puedes acercar a una familia al
            reencuentro que están esperando.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="bg-background text-foreground hover:bg-background/90 mt-8"
          >
            <Link href={ctaNav.reportFound.href}>
              {ctaNav.reportFound.title}
            </Link>
          </Button>
        </div>
      </Section>

      {/* Buscador por foto (IA) */}
      <Section className="pt-0">
        <div className="mx-auto max-w-3xl">
          <PhotoSearch />
        </div>
      </Section>

      {/* Buscador de coincidencias */}
      <Section className="pt-0">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-balance sm:text-3xl">
              Busca a tu mascota entre los reportes
            </h2>
            <p className="text-muted-foreground mt-3 text-pretty">
              Filtra por especie, estado o describe a tu mascota (color, raza,
              nombre) y revisa si ya está publicada entre las perdidas y
              encontradas.
            </p>
          </div>
          <GlobalSearch initial={{}} />
        </div>
      </Section>

      {/* Cifras (en tiempo real) */}
      <Section className="pt-0">
        <div className="border-border bg-secondary/30 rounded-3xl border px-6 py-10 sm:px-10">
          <h2 className="text-center text-2xl font-bold text-balance sm:text-3xl">
            Nuestra comunidad en cifras
          </h2>
          <LiveStats initial={stats} />
        </div>
      </Section>

      {/* Valores / cómo ayuda */}
      <Section className="pt-0">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {valores.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="border-border bg-card rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="bg-secondary text-primary grid size-11 place-items-center rounded-xl">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="font-heading mt-4 text-lg font-semibold">
                {title}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
