import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { getShelterById } from "@/lib/data/shelters";
import { Container } from "@/components/ui/container";
import {
  ShelterForm,
  type ShelterFormInitial,
} from "@/components/admin/shelter-form";

export const metadata: Metadata = {
  title: "Editar refugio · Panel",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminShelterEditPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const shelter = await getShelterById(id);
  if (!shelter) notFound();

  const social = (shelter.social ?? {}) as Record<string, string>;
  const initial: ShelterFormInitial = {
    name: shelter.name,
    kind: shelter.kind,
    country: shelter.country ?? "Colombia",
    city: shelter.city,
    region: shelter.region ?? "",
    address: shelter.address ?? "",
    description: shelter.description ?? "",
    managerName: shelter.manager_name ?? "",
    schedule: shelter.schedule ?? "",
    email: shelter.email ?? "",
    phone: shelter.phone ?? "",
    whatsapp: shelter.whatsapp ?? "",
    website: shelter.website ?? "",
    instagram: typeof social.instagram === "string" ? social.instagram : "",
    facebook: typeof social.facebook === "string" ? social.facebook : "",
    status: shelter.status,
    needs: shelter.needs,
    logoUrl: shelter.logo_url ?? "",
  };

  return (
    <>
      <Container className="py-10">
        <Link
          href="/admin/refugios"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Volver a refugios
        </Link>
        <h1 className="mb-8 text-2xl font-bold sm:text-3xl">{shelter.name}</h1>
        <div className="border-border bg-card max-w-2xl rounded-2xl border p-6 shadow-sm">
          <ShelterForm mode="edit" id={shelter.id} initial={initial} />
        </div>
      </Container>
    </>
  );
}
