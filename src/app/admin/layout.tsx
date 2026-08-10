import { getCurrentAdmin } from "@/lib/auth/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

// El panel administrativo depende de la sesión: nunca debe cachearse.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  // Sin sesión (p. ej. /admin/login): se muestra la página sola, sin barra.
  if (!admin) return <>{children}</>;

  return (
    <div className="md:flex md:min-h-screen">
      <AdminSidebar admin={{ full_name: admin.full_name, role: admin.role }} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
