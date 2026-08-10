import type { Metadata } from "next";
import { Video } from "lucide-react";

import { getSocialPets } from "@/lib/data/social-pets";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";
import { SocialPetCard } from "@/components/social/social-pet-card";

export const metadata: Metadata = {
  alternates: { canonical: "/vistas-en-redes" },
  title: "Vistas en redes",
  description:
    "Videos de TikTok e Instagram que difundimos para ayudar en Colombia: mascotas que buscan a su familia, refugios y causas que necesitan apoyo. Míralos y compártelos.",
};

// ISR: contenido curado por admin. Se regenera cada 10 min y al instante cuando
// el admin edita (las acciones llaman revalidatePath("/vistas-en-redes")).
export const revalidate = 600;

export default async function SocialPetsPage() {
  const pets = await getSocialPets();

  return (
    <>
      <PageHeader
        eyebrow="Difusión"
        title="Vistas en redes"
        description="Videos de TikTok e Instagram que circulan sin un contacto directo y necesitan difusión: mascotas que buscan a su familia, refugios y causas que piden ayuda. Ábrelos, compártelos o avísanos."
      />
      <Container className="py-10 lg:py-14">
        {pets.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <li key={pet.id}>
                <SocialPetCard pet={pet} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
            <span className="bg-secondary text-primary grid size-14 place-items-center rounded-2xl">
              <Video className="size-6" aria-hidden="true" />
            </span>
            <h2 className="font-heading mt-6 text-xl font-semibold">
              Aún no hay videos publicados
            </h2>
            <p className="text-muted-foreground mt-2">
              Pronto aparecerán aquí videos de mascotas, refugios y causas que
              necesitan ayuda.
            </p>
          </div>
        )}

        <p className="text-muted-foreground mt-8 text-center text-xs">
          Los videos son de sus creadores originales en TikTok e Instagram.
          Verifica la información en la fuente.
        </p>
      </Container>
    </>
  );
}
