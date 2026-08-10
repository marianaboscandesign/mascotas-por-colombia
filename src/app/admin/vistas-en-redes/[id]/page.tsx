import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { getSocialPetById } from "@/lib/data/social-pets";
import { Container } from "@/components/ui/container";
import {
  SocialPetForm,
  type SocialPetFormInitial,
} from "@/components/admin/social-pet-form";

export const metadata: Metadata = {
  title: "Editar video · Panel",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSocialPetPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const pet = await getSocialPetById(id);
  if (!pet) notFound();

  const initial: SocialPetFormInitial = {
    videoUrl: pet.video_url,
    species: pet.species ?? "",
    title: pet.title ?? "",
    state: pet.state ?? "",
    city: pet.city ?? "",
    note: pet.note ?? "",
    isPublished: pet.is_published,
    isResolved: pet.is_resolved,
  };

  return (
    <>
      <Container className="py-10">
        <Link
          href="/admin/vistas-en-redes"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Volver a vistas en redes
        </Link>
        <h1 className="mb-8 text-2xl font-bold sm:text-3xl">
          {pet.title ?? "Editar video"}
        </h1>
        <div className="border-border bg-card max-w-2xl rounded-2xl border p-6 shadow-sm">
          <SocialPetForm mode="edit" id={pet.id} initial={initial} />
        </div>
      </Container>
    </>
  );
}
