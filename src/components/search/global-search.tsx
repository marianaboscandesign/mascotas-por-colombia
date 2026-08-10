"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { SPECIES_OPTIONS } from "@/lib/constants/pets";
import { COLOMBIA_DEPARTMENTS } from "@/lib/constants/colombia";
import { cn } from "@/lib/utils";
import { type SearchableKind } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface GlobalSearchInitial {
  q?: string;
  state?: string;
  species?: string;
  kinds?: SearchableKind[];
}

const ALL = "todos";

const KIND_OPTIONS: { value: SearchableKind; label: string }[] = [
  { value: "perdida", label: "Perdidas" },
  { value: "encontrada", label: "Encontradas" },
  { value: "rescatada", label: "Rescatadas" },
];

export function GlobalSearch({ initial }: { initial: GlobalSearchInitial }) {
  const router = useRouter();
  const [q, setQ] = React.useState(initial.q ?? "");
  const [state, setState] = React.useState(initial.state ?? ALL);
  const [species, setSpecies] = React.useState(initial.species ?? ALL);
  const [kinds, setKinds] = React.useState<SearchableKind[]>(
    initial.kinds ?? [],
  );

  function toggleKind(value: SearchableKind) {
    setKinds((prev) =>
      prev.includes(value) ? prev.filter((k) => k !== value) : [...prev, value],
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (state !== ALL) params.set("state", state);
    if (species !== ALL) params.set("species", species);
    if (kinds.length > 0 && kinds.length < KIND_OPTIONS.length) {
      params.set("kind", kinds.join(","));
    }
    const qs = params.toString();
    router.push(qs ? `/buscar?${qs}` : "/buscar");
  }

  function clear() {
    setQ("");
    setState(ALL);
    setSpecies(ALL);
    setKinds([]);
    router.push("/buscar");
  }

  const hasFilters =
    Boolean(q.trim()) || state !== ALL || species !== ALL || kinds.length > 0;

  return (
    <form
      onSubmit={submit}
      className="border-border bg-card space-y-5 rounded-2xl border p-5 shadow-sm"
    >
      {/* Texto libre */}
      <div className="space-y-1.5">
        <Label htmlFor="search-q">Buscar</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="search-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre, ciudad, color o raza…"
            className="sm:flex-1"
          />
          <Button type="submit" className="sm:w-auto">
            <Search className="size-4" />
            Buscar
          </Button>
        </div>
      </div>

      {/* Filtros estructurados */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="search-state">Estado</Label>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger id="search-state">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los estados</SelectItem>
              {COLOMBIA_DEPARTMENTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="search-species">Especie</Label>
          <Select value={species} onValueChange={setSpecies}>
            <SelectTrigger id="search-species">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las especies</SelectItem>
              {SPECIES_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtros avanzados: tipo de reporte */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Tipo de reporte</legend>
        <div className="flex flex-wrap gap-2">
          {KIND_OPTIONS.map((opt) => {
            const active = kinds.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleKind(opt.value)}
                className={cn(
                  "focus-visible:ring-ring rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs">
          Sin selección se muestran todos los tipos.
        </p>
      </fieldset>

      {hasFilters && (
        <div className="border-border flex justify-end border-t pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            <X className="size-4" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </form>
  );
}
