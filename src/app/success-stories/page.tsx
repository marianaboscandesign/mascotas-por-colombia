import type { Metadata } from "next";
import { HeartHandshake } from "lucide-react";

import { getSuccessStories } from "@/lib/data/success-stories";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";
import { StoryCard } from "@/components/success/story-card";

export const metadata: Metadata = {
  title: "Historias de Reencuentro",
  description:
    "Mascotas que ya volvieron con su familia. Cada reencuentro nos llena de esperanza.",
  alternates: { canonical: "/success-stories" },
  openGraph: {
    title: `Historias de Reencuentro · ${siteConfig.name}`,
    description:
      "Mascotas que ya volvieron con su familia gracias a la comunidad.",
    url: `${siteConfig.url}/success-stories`,
  },
};

export default async function SuccessStoriesPage() {
  const stories = await getSuccessStories();

  return (
    <>
      <PageHeader
        eyebrow="Reencuentros"
        title="Historias de Reencuentro"
        description="Cada una de estas mascotas volvió a casa. Gracias a quienes reportaron, compartieron y ayudaron a que sucediera."
      />
      <Container className="py-10 lg:py-14">
        {stories.length > 0 ? (
          <>
            <p className="text-muted-foreground mb-8 text-sm">
              {stories.length}{" "}
              {stories.length === 1
                ? "mascota reunida con su familia"
                : "mascotas reunidas con su familia"}{" "}
              💚
            </p>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <li key={`${story.kind}-${story.id}`}>
                  <StoryCard story={story} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
            <span className="bg-success/15 text-success grid size-14 place-items-center rounded-2xl">
              <HeartHandshake className="size-6" aria-hidden="true" />
            </span>
            <h2 className="font-heading mt-6 text-xl font-semibold">
              Pronto habrá historias que contar
            </h2>
            <p className="text-muted-foreground mt-2">
              Cuando una mascota vuelva con su familia, su historia aparecerá
              aquí para inspirar a toda la comunidad.
            </p>
          </div>
        )}
      </Container>
    </>
  );
}
