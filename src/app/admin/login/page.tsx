import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentAdmin } from "@/lib/auth/admin";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/common/logo";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Acceso administrativo",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin/refugios");

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <h1 className="font-heading mt-6 text-2xl font-bold">
            Panel administrativo
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Acceso exclusivo para el equipo de Mascotas por Colombia.
          </p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </Container>
  );
}
