import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentModerator } from "@/lib/auth/moderator";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/common/logo";
import { ChangePasswordForm } from "@/components/moderador/change-password-form";

export const metadata: Metadata = {
  title: "Define tu contraseña",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ChangeModeratorPasswordPage() {
  // Usa getCurrentModerator (no requireModerator) para no crear un bucle:
  // requireModerator redirige aquí cuando falta cambiar la contraseña.
  const mod = await getCurrentModerator();
  if (!mod) redirect("/moderador/login");

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <h1 className="font-heading mt-6 text-2xl font-bold">
            Define tu contraseña
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Por seguridad, elige una contraseña propia para tu cuenta antes de
            continuar.
          </p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
          <ChangePasswordForm />
        </div>
      </div>
    </Container>
  );
}
