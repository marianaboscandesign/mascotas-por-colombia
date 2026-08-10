import Link from "next/link";
import { CheckCircle2, MapPin } from "lucide-react";

import { type SuccessStory } from "@/lib/data/success-stories";
import { petThumbFromUrl } from "@/lib/storage/pet-photos";
import { formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

export function StoryCard({
  story,
  compact = false,
}: {
  story: SuccessStory;
  compact?: boolean;
}) {
  return (
    <article className="group border-border bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md">
      <div className="bg-muted relative aspect-[4/3] overflow-hidden">
        {story.photo ? (
          <ImageWithFallback
            src={petThumbFromUrl(story.photo)}
            fallbackSrc={story.photo}
            alt={`Foto de ${story.title}, reunida con su familia`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="from-success/20 to-background h-full bg-gradient-to-br" />
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-success text-success-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Reunida con su familia
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-semibold">{story.title}</h3>
        <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          {story.city}, {story.state}
        </p>

        {!compact && (
          <dl className="text-muted-foreground mt-4 space-y-1 text-sm">
            {story.startDate && (
              <div className="flex justify-between gap-3">
                <dt>{story.kind === "perdida" ? "Se perdió" : "Encontrada"}</dt>
                <dd className="text-foreground font-medium">
                  {formatDate(story.startDate)}
                </dd>
              </div>
            )}
            {story.reunionDate && (
              <div className="flex justify-between gap-3">
                <dt>Reencuentro</dt>
                <dd className="text-foreground font-medium">
                  {formatDate(story.reunionDate)}
                </dd>
              </div>
            )}
            {story.daysMissing != null && (
              <div className="flex justify-between gap-3">
                <dt>Tiempo separados</dt>
                <dd className="text-foreground font-medium">
                  {story.daysMissing} {story.daysMissing === 1 ? "día" : "días"}
                </dd>
              </div>
            )}
          </dl>
        )}

        {!compact && (
          <p className="text-success mt-4 text-sm font-semibold">
            ¡Reunida con su familia! 🎉
          </p>
        )}

        <div className="mt-auto pt-4">
          <Link
            href={story.href}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full justify-center",
            )}
          >
            Ver historia
          </Link>
        </div>
      </div>
    </article>
  );
}
