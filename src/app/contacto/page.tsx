import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  alternates: { canonical: "/contacto" },
  title: "Contacto",
  description:
    "¿Tienes dudas o quieres colaborar? Escríbenos, estamos para ayudarte.",
};

export default function ContactoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Hablemos"
        title="Contacto"
        description="¿Necesitas ayuda o quieres colaborar? Nos encantaría saber de ti."
      />
      <Container className="py-10 lg:py-14">
        <div className="mx-auto max-w-2xl">
          <ContactForm />
        </div>
      </Container>
    </>
  );
}
