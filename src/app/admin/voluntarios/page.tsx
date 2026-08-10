import type { Metadata } from "next";
import { Mail, MessageCircle, Phone } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { getAllVolunteersForAdmin } from "@/lib/data/volunteers";
import { VOLUNTEER_ROLE_LABELS } from "@/lib/constants/volunteers";
import { formatDate, whatsappNumber } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { VolunteerControls } from "@/components/admin/volunteer-controls";

export const metadata: Metadata = {
  title: "Voluntarios · Panel",
  robots: { index: false, follow: false },
};

export default async function AdminVolunteersPage() {
  await requireAdmin();
  const volunteers = await getAllVolunteersForAdmin();

  return (
    <>
      <Container className="py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Voluntarios</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Directorio privado de personas registradas para ayudar.
            {volunteers.length > 0 && ` ${volunteers.length} en total.`}
          </p>
        </div>

        {volunteers.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border p-6 text-center text-sm">
            Todavía no hay voluntarios registrados.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {volunteers.map((v) => (
              <li
                key={v.id}
                className="border-border bg-card flex flex-col gap-3 rounded-xl border p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading font-semibold">
                        {v.full_name}
                      </h2>
                      {v.public_contact.length > 0 ? (
                        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                          {v.status === "activo"
                            ? "En directorio"
                            : "Acepta contacto"}
                        </span>
                      ) : (
                        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                          Sin contacto público
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {v.profession ?? "—"} · {v.city ?? "—"}, {v.state}
                    </p>
                    {v.public_contact.length > 0 && (
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Muestra: {v.public_contact.join(", ")}
                        {v.status === "activo"
                          ? ""
                          : " · aparecerá al marcarlo “activo”"}
                      </p>
                    )}
                  </div>
                  <VolunteerControls
                    id={v.id}
                    status={v.status}
                    available={
                      [
                        v.email ? "email" : null,
                        v.whatsapp ? "whatsapp" : null,
                        v.phone ? "phone" : null,
                      ].filter(Boolean) as ("email" | "phone" | "whatsapp")[]
                    }
                    publicContact={v.public_contact}
                  />
                </div>

                {v.skills.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {v.skills.map((role) => (
                      <li
                        key={role}
                        className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs font-medium"
                      >
                        {VOLUNTEER_ROLE_LABELS[role] ?? role}
                      </li>
                    ))}
                  </ul>
                )}

                {v.availability && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">
                      Disponibilidad:{" "}
                    </span>
                    {v.availability}
                  </p>
                )}

                {v.bio && (
                  <p className="text-muted-foreground text-sm">{v.bio}</p>
                )}

                <div className="border-border flex flex-wrap gap-3 border-t pt-3 text-sm">
                  <a
                    href={`mailto:${v.email}`}
                    className="text-primary inline-flex items-center gap-1.5 hover:underline"
                  >
                    <Mail className="size-4" />
                    {v.email}
                  </a>
                  {v.phone && (
                    <a
                      href={`tel:${v.phone.replace(/\s/g, "")}`}
                      className="text-primary inline-flex items-center gap-1.5 hover:underline"
                    >
                      <Phone className="size-4" />
                      {v.phone}
                    </a>
                  )}
                  {v.whatsapp && (
                    <a
                      href={`https://wa.me/${whatsappNumber(v.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary inline-flex items-center gap-1.5 hover:underline"
                    >
                      <MessageCircle className="size-4" />
                      WhatsApp
                    </a>
                  )}
                </div>

                <p className="text-muted-foreground text-xs">
                  Registrado el {formatDate(v.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
