import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { getFreeVetById } from "@/lib/data/free-vets";
import { Container } from "@/components/ui/container";
import {
  FreeVetForm,
  type FreeVetFormInitial,
} from "@/components/admin/free-vet-form";

export const metadata: Metadata = {
  title: "Editar servicio veterinario · Panel",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFreeVetPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const vet = await getFreeVetById(id);
  if (!vet) notFound();

  const initial: FreeVetFormInitial = {
    name: vet.name,
    description: vet.description ?? "",
    city: vet.city,
    state: vet.state ?? "",
    region: vet.region ?? "",
    sedes: vet.sedes.join("\n"),
    phones: vet.phones.join("\n"),
    whatsapp: vet.whatsapp ?? "",
    address: vet.address ?? "",
    schedule: vet.schedule ?? "",
    source: vet.source ?? "",
    validUntil: vet.valid_until ?? "",
    isPublished: vet.is_published,
  };

  return (
    <>
      <Container className="py-10">
        <Link
          href="/admin/veterinarios"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Volver a veterinarios
        </Link>
        <h1 className="mb-8 text-2xl font-bold sm:text-3xl">{vet.name}</h1>
        <div className="border-border bg-card max-w-2xl rounded-2xl border p-6 shadow-sm">
          <FreeVetForm mode="edit" id={vet.id} initial={initial} />
        </div>
      </Container>
    </>
  );
}
