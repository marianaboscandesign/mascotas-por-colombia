import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { Container } from "@/components/ui/container";
import { SocialPetForm } from "@/components/admin/social-pet-form";

export const metadata: Metadata = {
  title: "Nuevo video · Panel",
  robots: { index: false, follow: false },
};

export default async function NewSocialPetPage() {
  await requireAdmin();

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
        <h1 className="mb-8 text-2xl font-bold sm:text-3xl">Nuevo video</h1>
        <div className="border-border bg-card max-w-2xl rounded-2xl border p-6 shadow-sm">
          <SocialPetForm mode="create" />
        </div>
      </Container>
    </>
  );
}
