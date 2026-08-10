import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { type PublicVolunteer } from "@/lib/data/volunteers";
import { VOLUNTEER_ROLE_LABELS } from "@/lib/constants/volunteers";
import { whatsappNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function VolunteerCard({ volunteer }: { volunteer: PublicVolunteer }) {
  const whatsappDigits = volunteer.whatsapp
    ? whatsappNumber(volunteer.whatsapp)
    : undefined;
  const location = [volunteer.city, volunteer.state].filter(Boolean).join(", ");

  return (
    <article className="border-border bg-card flex h-full flex-col rounded-2xl border p-5 shadow-sm">
      <div>
        <h3 className="font-heading text-lg font-semibold">
          {volunteer.full_name}
        </h3>
        {volunteer.profession && (
          <p className="text-primary text-sm font-medium">
            {volunteer.profession}
          </p>
        )}
        {location && (
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {location}
          </p>
        )}
      </div>

      {volunteer.skills.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {volunteer.skills.map((role) => (
            <li
              key={role}
              className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs font-medium"
            >
              {VOLUNTEER_ROLE_LABELS[role] ?? role}
            </li>
          ))}
        </ul>
      )}

      {volunteer.availability && (
        <p className="mt-3 text-sm">
          <span className="text-muted-foreground">Disponibilidad: </span>
          {volunteer.availability}
        </p>
      )}

      {volunteer.bio && (
        <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">
          {volunteer.bio}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        {whatsappDigits && (
          <Button asChild variant="warm" size="sm" className="justify-start">
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden="true" />
              Escribir por WhatsApp
            </a>
          </Button>
        )}
        {volunteer.phone && (
          <Button asChild variant="outline" size="sm" className="justify-start">
            <a href={`tel:${volunteer.phone.replace(/\s/g, "")}`}>
              <Phone aria-hidden="true" />
              {volunteer.phone}
            </a>
          </Button>
        )}
        {volunteer.email && (
          <Button asChild variant="outline" size="sm" className="justify-start">
            <a href={`mailto:${volunteer.email}`}>
              <Mail aria-hidden="true" />
              Enviar correo
            </a>
          </Button>
        )}
      </div>
    </article>
  );
}
