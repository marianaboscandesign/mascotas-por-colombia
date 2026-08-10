import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  HandHeart,
  HeartHandshake,
  Home,
  MessageSquare,
  PawPrint,
  Search,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { getDashboardStats } from "@/lib/data/admin-stats";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const stats = await getDashboardStats();

  const cards = [
    {
      label: "Mascotas perdidas",
      value: stats.lostActive,
      hint: "búsqueda activa",
      icon: Search,
    },
    {
      label: "Mascotas encontradas",
      value: stats.foundActive,
      hint: "en resguardo",
      icon: PawPrint,
    },
    {
      label: "Mascotas rescatadas",
      value: stats.rescued,
      hint: "en refugios",
      icon: ShieldCheck,
    },
    {
      label: "Mascotas reunidas",
      value: stats.reunited,
      hint: "¡vueltas a casa!",
      icon: HeartHandshake,
    },
    {
      label: "Tasa de éxito",
      value: `${stats.successRate}%`,
      hint: "reportes resueltos",
      icon: TrendingUp,
    },
    {
      label: "Refugios registrados",
      value: stats.shelters,
      hint: "en la plataforma",
      icon: Home,
    },
    {
      label: "Voluntarios registrados",
      value: stats.volunteers,
      hint: "dispuestos a ayudar",
      icon: Users,
    },
  ];

  return (
    <>
      <Container className="py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Hola, {admin.full_name.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Resumen de la plataforma.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ label, value, hint, icon: Icon }) => (
            <div
              key={label}
              className="border-border bg-card rounded-2xl border p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">
                  {label}
                </span>
                <span className="bg-secondary text-primary grid size-9 place-items-center rounded-lg">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold">{value}</p>
              <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
            </div>
          ))}
        </div>

        {stats.pendingApproval > 0 && (
          <Link
            href="/admin/publicaciones?estado=ocultas"
            className="border-warning/30 bg-warning/10 text-warning mt-6 flex items-center gap-3 rounded-xl border p-4 text-sm font-medium hover:underline"
          >
            <FileText className="size-5" />
            {stats.pendingApproval} publicación(es) oculta(s) pendientes de
            revisión
          </Link>
        )}

        <div className="mt-10">
          <h2 className="font-heading text-lg font-semibold">Gestión</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLink href="/admin/publicaciones" icon={FileText}>
              Publicaciones
            </QuickLink>
            <QuickLink href="/admin/refugios" icon={Home}>
              Centros de acopio
            </QuickLink>
            <QuickLink href="/admin/veterinarios" icon={Stethoscope}>
              Veterinarios gratuitos
            </QuickLink>
            <QuickLink href="/admin/vistas-en-redes" icon={Video}>
              Vistas en redes
            </QuickLink>
            <QuickLink href="/admin/donaciones" icon={HandHeart}>
              Donaciones
            </QuickLink>
            <QuickLink href="/admin/voluntarios" icon={Users}>
              Voluntarios
            </QuickLink>
            <QuickLink href="/admin/contacto" icon={MessageSquare}>
              Mensajes de contacto
            </QuickLink>
            {admin.role === "super_admin" && (
              <QuickLink href="/admin/moderadores" icon={ShieldCheck}>
                Moderadores
              </QuickLink>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}

function QuickLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="border-border bg-card hover:border-primary/50 flex items-center gap-3 rounded-xl border p-4 text-sm font-medium shadow-sm transition-colors"
    >
      <span className="bg-secondary text-primary grid size-9 place-items-center rounded-lg">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      {children}
    </Link>
  );
}
