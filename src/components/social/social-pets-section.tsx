import Link from "next/link";

import { getSocialPets } from "@/lib/data/social-pets";
import { routes } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SocialPetCard } from "@/components/social/social-pet-card";

/**
 * Sección "Vistas en redes" reutilizable: muestra hasta `limit` videos de
 * TikTok/Instagram (mascotas, refugios y causas que necesitan difusión). No
 * renderiza nada si no hay.
 */
export async function SocialPetsSection({
  limit = 3,
  className,
}: {
  limit?: number;
  className?: string;
}) {
  const pets = (await getSocialPets()).slice(0, limit);
  if (pets.length === 0) return null;

  return (
    <section className={cn(className)} aria-labelledby="vistas-en-redes">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="vistas-en-redes"
            className="font-heading text-lg font-semibold"
          >
            Vistas en redes
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Videos de TikTok e Instagram: mascotas que buscan a su familia,
            refugios y causas que necesitan ayuda.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={routes.socialPets}>Ver todas</Link>
        </Button>
      </div>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => (
          <li key={pet.id}>
            <SocialPetCard pet={pet} />
          </li>
        ))}
      </ul>
    </section>
  );
}
