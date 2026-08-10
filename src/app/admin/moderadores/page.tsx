import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import { getModerators } from "@/lib/data/moderators";
import { Container } from "@/components/ui/container";
import { ModeratorManager } from "@/components/admin/moderator-manager";

export const metadata: Metadata = {
  title: "Moderadores · Panel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminModeratorsPage() {
  const admin = await requireAdmin();
  // Solo el super administrador gestiona moderadores.
  if (admin.role !== "super_admin") redirect("/admin");

  const moderators = await getModerators();

  return (
    <>
      <Container className="py-10">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Moderadores</h1>
        <p className="text-muted-foreground mb-8">
          Voluntarios con acceso al panel de moderación (
          <code className="text-xs">/moderador</code>). No pueden gestionar
          usuarios, configuración ni acceder a esta sección.
        </p>
        <ModeratorManager moderators={moderators} />
      </Container>
    </>
  );
}
