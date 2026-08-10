import {
  CalendarClock,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Stethoscope,
} from "lucide-react";

import { type FreeVetService } from "@/lib/data/free-vets";
import { formatDate, whatsappNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function locationLabel(v: FreeVetService): string {
  return [v.city, v.region ?? v.state].filter(Boolean).join(", ");
}

export function FreeVetCard({ vet }: { vet: FreeVetService }) {
  const whatsappDigits = vet.whatsapp
    ? whatsappNumber(vet.whatsapp)
    : undefined;

  return (
    <article className="border-border bg-card flex h-full flex-col rounded-2xl border p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="bg-secondary text-primary grid size-12 shrink-0 place-items-center rounded-2xl">
          <Stethoscope className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <Badge variant="success" className="mb-1.5">
            Gratuito
          </Badge>
          <h3 className="font-heading line-clamp-2 text-base font-semibold">
            {vet.name}
          </h3>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{locationLabel(vet)}</span>
          </p>
        </div>
      </div>

      {vet.description && (
        <p className="text-muted-foreground mt-3 line-clamp-3 text-sm">
          {vet.description}
        </p>
      )}

      {vet.sedes.length > 0 && (
        <div className="mt-4">
          <p className="text-foreground text-xs font-semibold">Sedes</p>
          <ul className="text-muted-foreground mt-1.5 flex flex-wrap gap-1.5">
            {vet.sedes.map((sede) => (
              <li
                key={sede}
                className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs"
              >
                {sede}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(vet.schedule || vet.valid_until) && (
        <div className="text-muted-foreground mt-4 space-y-1 text-sm">
          {vet.schedule && (
            <p className="flex items-center gap-1.5">
              <Clock className="size-4 shrink-0" aria-hidden="true" />
              <span className="line-clamp-1">{vet.schedule}</span>
            </p>
          )}
          {vet.valid_until && (
            <p className="flex items-center gap-1.5">
              <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
              Vigente hasta {formatDate(vet.valid_until)}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-1.5 pt-4">
        {whatsappDigits && (
          <a
            href={`https://wa.me/${whatsappDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-warm text-warm-foreground hover:bg-warm/90 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            WhatsApp
          </a>
        )}
        {vet.phones.map((phone) => (
          <a
            key={phone}
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="border-border text-foreground hover:bg-secondary inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
          >
            <Phone className="size-4 shrink-0" aria-hidden="true" />
            {phone}
          </a>
        ))}
      </div>

      {vet.source && (
        <p className="text-muted-foreground mt-3 text-xs">
          Fuente: {vet.source}
        </p>
      )}
    </article>
  );
}
