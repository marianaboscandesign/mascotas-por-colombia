import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { getDonationOrgById } from "@/lib/data/donations";
import { Container } from "@/components/ui/container";
import {
  DonationOrgForm,
  type DonationOrgFormInitial,
} from "@/components/admin/donation-org-form";

export const metadata: Metadata = {
  title: "Editar organización · Panel",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDonationOrgPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const org = await getDonationOrgById(id);
  if (!org) notFound();

  const initial: DonationOrgFormInitial = {
    name: org.name,
    url: org.url,
    urlLabel: org.url_label,
    instagram: org.instagram ?? "",
    description: org.description,
    sortOrder: org.sort_order,
    isPublished: org.is_published,
  };

  return (
    <>
      <Container className="py-10">
        <Link
          href="/admin/donaciones"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Volver a donaciones
        </Link>
        <h1 className="mb-8 text-2xl font-bold sm:text-3xl">{org.name}</h1>
        <div className="border-border bg-card max-w-2xl rounded-2xl border p-6 shadow-sm">
          <DonationOrgForm mode="edit" id={org.id} initial={initial} />
        </div>
      </Container>
    </>
  );
}
