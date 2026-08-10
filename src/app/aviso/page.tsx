import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  HandHeart,
  Lock,
  ShieldCheck,
  Users,
} from "lucide-react";

import { routes } from "@/config/navigation";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = {
  alternates: { canonical: "/aviso" },
  title: "Aviso de seguridad y términos de uso",
  description:
    "Mascotas por Colombia es una plataforma gratuita para reunir mascotas con sus familias. Nunca solicitamos pagos. Cuídate de estafas y conoce nuestros términos de uso.",
};

export default function NoticePage() {
  return (
    <>
      <PageHeader
        eyebrow="Importante"
        title="Aviso de seguridad y términos de uso"
        description="Somos una plataforma solidaria y gratuita que ayuda a reunir mascotas con sus familias. Lee esto para usarla de forma segura."
      />

      <Container className="py-10 lg:py-14">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          {/* Aviso destacado sobre estafas */}
          <div className="border-warm/30 bg-warm-soft/50 flex flex-col gap-3 rounded-2xl border p-6">
            <div className="flex items-center gap-3">
              <span className="bg-warm/15 text-warm grid size-11 shrink-0 place-items-center rounded-xl">
                <AlertTriangle className="size-5" aria-hidden="true" />
              </span>
              <h2 className="font-heading text-lg font-semibold">
                Cuídate de las estafas
              </h2>
            </div>
            <p className="text-foreground text-sm leading-relaxed">
              Si alguien te contacta diciendo que encontró a tu mascota y te
              solicita <strong>dinero, transferencias o cualquier pago</strong>{" "}
              para devolvértela, actúa con mucha precaución. Es una táctica común
              de fraude y extorsión.
            </p>
          </div>

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="bg-secondary text-primary grid size-11 shrink-0 place-items-center rounded-xl">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <h2 className="font-heading text-xl font-semibold">
                Nunca pedimos pagos
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Nuestra plataforma <strong>nunca</strong> solicita pagos,
              comisiones ni cobra por publicar, buscar o recuperar una mascota.
              Todo el servicio es <strong>gratuito</strong>. Si ves que alguien
              cobra en nuestro nombre, no le pagues y avísanos.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="bg-secondary text-primary grid size-11 shrink-0 place-items-center rounded-xl">
                <Users className="size-5" aria-hidden="true" />
              </span>
              <h2 className="font-heading text-xl font-semibold">
                Solo somos un punto de encuentro
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Nuestro propósito es <strong>conectar personas</strong> para que
              más mascotas regresen a casa. No intermediamos en los acuerdos
              entre particulares ni nos hacemos responsables por intentos de
              fraude, extorsión o por la información que cada persona publica.
              Antes de entregar dinero o información personal, verifica siempre
              los datos y, si es posible, coordina un{" "}
              <strong>encuentro en un lugar público y seguro</strong>.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="bg-secondary text-primary grid size-11 shrink-0 place-items-center rounded-xl">
                <Lock className="size-5" aria-hidden="true" />
              </span>
              <h2 className="font-heading text-xl font-semibold">
                Tus datos y privacidad
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Los datos de contacto que incluyes en un reporte (como tu teléfono
              o WhatsApp) se publican para que otras personas puedan
              comunicarse contigo. Comparte solo lo necesario. Puedes pedir que
              editemos o eliminemos tu reporte cuando quieras escribiéndonos
              desde la{" "}
              <Link
                href={routes.contact}
                className="text-primary font-medium underline-offset-2 hover:underline"
              >
                página de contacto
              </Link>
              .
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="bg-secondary text-primary grid size-11 shrink-0 place-items-center rounded-xl">
                <HandHeart className="size-5" aria-hidden="true" />
              </span>
              <h2 className="font-heading text-xl font-semibold">Gracias</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Gracias por confiar en nosotros y por ayudarnos a construir una
              comunidad basada en el respeto, la solidaridad y el amor por los
              animales. Al usar la plataforma aceptas este aviso y te
              comprometes a publicar información veraz y a tratar a los demás con
              respeto.
            </p>
          </section>

          <p className="text-muted-foreground border-border border-t pt-6 text-sm">
            ¿Detectaste un intento de estafa o un perfil sospechoso?{" "}
            <Link
              href={routes.contact}
              className="text-primary font-medium underline-offset-2 hover:underline"
            >
              Repórtalo aquí
            </Link>{" "}
            y nos encargamos.
          </p>
        </div>
      </Container>
    </>
  );
}
