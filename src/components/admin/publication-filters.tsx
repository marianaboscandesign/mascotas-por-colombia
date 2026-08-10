"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { SPECIES_OPTIONS } from "@/lib/constants/pets";
import { COLOMBIA_DEPARTMENTS } from "@/lib/constants/colombia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "todos";

export interface PublicationFilterValues {
  q?: string;
  tipo?: string;
  especie?: string;
  edo?: string;
  estado?: string;
}

/** Barra de filtros del panel de publicaciones (busca y ubica una mascota). */
export function PublicationFilters({
  initial,
}: {
  initial: PublicationFilterValues;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState(initial.q ?? "");
  const [tipo, setTipo] = React.useState(initial.tipo || ALL);
  const [especie, setEspecie] = React.useState(initial.especie || ALL);
  const [edo, setEdo] = React.useState(initial.edo || ALL);
  const [estado, setEstado] = React.useState(initial.estado || ALL);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (tipo !== ALL) params.set("tipo", tipo);
    if (especie !== ALL) params.set("especie", especie);
    if (edo !== ALL) params.set("edo", edo);
    if (estado !== ALL) params.set("estado", estado);
    const qs = params.toString();
    router.push(qs ? `/admin/publicaciones?${qs}` : "/admin/publicaciones");
  }

  function clear() {
    setQ("");
    setTipo(ALL);
    setEspecie(ALL);
    setEdo(ALL);
    setEstado(ALL);
    router.push("/admin/publicaciones");
  }

  const hasFilters =
    Boolean(q.trim()) ||
    tipo !== ALL ||
    especie !== ALL ||
    edo !== ALL ||
    estado !== ALL;

  return (
    <form
      onSubmit={apply}
      className="border-border bg-card mb-6 space-y-4 rounded-2xl border p-4 shadow-sm"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o ciudad…"
          className="sm:flex-1"
        />
        <Button type="submit">
          <Search className="size-4" />
          Buscar
        </Button>
        {hasFilters && (
          <Button type="button" variant="ghost" onClick={clear}>
            <X className="size-4" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger aria-label="Tipo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Perdidas y encontradas</SelectItem>
            <SelectItem value="perdida">Perdidas</SelectItem>
            <SelectItem value="encontrada">Encontradas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={especie} onValueChange={setEspecie}>
          <SelectTrigger aria-label="Especie">
            <SelectValue placeholder="Especie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toda especie</SelectItem>
            {SPECIES_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={edo} onValueChange={setEdo}>
          <SelectTrigger aria-label="Estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todo estado</SelectItem>
            {COLOMBIA_DEPARTMENTS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger aria-label="Visibilidad">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toda visibilidad</SelectItem>
            <SelectItem value="urgentes">Destacadas</SelectItem>
            <SelectItem value="ocultas">Ocultas</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
  );
}
