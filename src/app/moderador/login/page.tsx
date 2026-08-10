import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentModerator } from "@/lib/auth/moderator";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/common/logo";
import { ModeratorLoginForm } from "@/components/moderador/moderator-login-form";

export const metadata: Metadata = {
  title: "Acceso de moderador",
  robots: { index: false, follow: false },
};

export default async function ModeratorLoginPage() {
  const mod = await getCurrentModerator();
  if (mod) redirect("/moderador");

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <h1 className="font-heading mt-6 text-2xl font-bold">
            Panel de moderación
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Acceso para el equipo de moderadores voluntarios.
          </p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
          <ModeratorLoginForm />
        </div>
      </div>
    </Container>
  );
}
