import type { Metadata } from "next";
import { Mail, MessageSquare, Phone } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { getContactMessages } from "@/lib/data/contact-messages";
import { formatDate } from "@/lib/utils";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Mensajes de contacto · Panel",
  robots: { index: false, follow: false },
};

export default async function AdminContactPage() {
  await requireAdmin();
  const messages = await getContactMessages();

  return (
    <>
      <Container className="py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Mensajes de contacto
          </h1>
          <span className="text-muted-foreground text-sm">
            {messages.length} {messages.length === 1 ? "mensaje" : "mensajes"}
          </span>
        </div>

        {messages.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border p-6 text-center text-sm">
            Aún no hay mensajes de contacto.
          </p>
        ) : (
          <ul className="space-y-4">
            {messages.map((m) => (
              <li
                key={m.id}
                className="border-border bg-card rounded-2xl border p-5 shadow-sm"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-secondary text-primary grid size-9 shrink-0 place-items-center rounded-lg">
                      <MessageSquare className="size-4" aria-hidden="true" />
                    </span>
                    <h2 className="font-heading text-lg font-semibold">
                      {m.name}
                    </h2>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(m.created_at)}
                  </span>
                </div>

                {m.subject && (
                  <p className="text-foreground mt-3 text-sm font-medium">
                    {m.subject}
                  </p>
                )}
                <p className="text-muted-foreground mt-1 text-sm whitespace-pre-line">
                  {m.message}
                </p>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  <a
                    href={`tel:${m.phone}`}
                    className="text-primary inline-flex items-center gap-1.5 font-medium hover:underline"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {m.phone}
                  </a>
                  {m.email && (
                    <a
                      href={`mailto:${m.email}`}
                      className="text-primary inline-flex items-center gap-1.5 font-medium hover:underline"
                    >
                      <Mail className="size-4" aria-hidden="true" />
                      {m.email}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
