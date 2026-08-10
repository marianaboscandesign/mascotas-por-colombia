"use client";

import * as React from "react";

import { COUNTRIES, DEFAULT_DIAL } from "@/lib/constants/countries";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

/** Códigos ordenados de mayor a menor longitud, para emparejar el más largo. */
const DIALS_BY_LENGTH = [...COUNTRIES]
  .map((c) => c.dial)
  .sort((a, b) => b.length - a.length);

/** Separa un valor guardado en { prefijo, número local }. */
function parsePhone(value: string): { dial: string; local: string } {
  const trimmed = (value ?? "").trim();
  if (trimmed.startsWith("+")) {
    const raw = trimmed.slice(1).replace(/\D/g, "");
    const dial = DIALS_BY_LENGTH.find((d) => raw.startsWith(d));
    if (dial) return { dial, local: raw.slice(dial.length) };
    return { dial: DEFAULT_DIAL, local: raw };
  }
  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  return { dial: DEFAULT_DIAL, local: digits };
}

/**
 * Campo de teléfono con selector de país. Emite un único valor combinado
 * "+<prefijo> <número>" (sin el 0 troncal), listo para WhatsApp y para llamar.
 */
export function PhoneField({
  value,
  onChange,
  id,
  placeholder = "412 0000000",
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}) {
  const parsed = parsePhone(value);
  const [dial, setDial] = React.useState(parsed.dial);
  const [local, setLocal] = React.useState(parsed.local);

  // Sincronizar el estado interno si el valor cambia externamente (ej: autocompletado de la IA)
  React.useEffect(() => {
    const nextParsed = parsePhone(value);
    setDial(nextParsed.dial);
    setLocal(nextParsed.local);
  }, [value]);

  function emit(nextDial: string, nextLocal: string) {
    const clean = nextLocal.replace(/\D/g, "").replace(/^0+/, "");
    onChange(clean ? `+${nextDial} ${clean}` : "");
  }

  return (
    <div className="flex gap-2">
      <Select
        value={dial}
        onValueChange={(d) => {
          setDial(d);
          emit(d, local);
        }}
      >
        <SelectTrigger className="w-24 shrink-0" aria-label="Código de país">
          <span>+{dial}</span>
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((c) => (
            <SelectItem key={c.name} value={c.dial}>
              +{c.dial} · {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        value={local}
        placeholder={placeholder}
        onChange={(e) => {
          setLocal(e.target.value);
          emit(dial, e.target.value);
        }}
      />
    </div>
  );
}
