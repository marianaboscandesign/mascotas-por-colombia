"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { SPECIES_OPTIONS } from "@/lib/constants/pets";
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

export interface FoundPetsFilterValues {
  city?: string;
  species?: string;
  color?: string;
}

const ALL = "todas";

/** Barra de búsqueda por ciudad, especie y color (sincroniza con la URL). */
export function FoundPetsFilters({
  initial,
}: {
  initial: FoundPetsFilterValues;
}) {
  const router = useRouter();
  const [city, setCity] = React.useState(initial.city ?? "");
  const [color, setColor] = React.useState(initial.color ?? "");
  const [species, setSpecies] = React.useState(initial.species ?? ALL);

  const hasFilters = Boolean(city || color || (species && species !== ALL));

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (color.trim()) params.set("color", color.trim());
    if (species && species !== ALL) params.set("species", species);
    const qs = params.toString();
    router.push(qs ? `/found-pets?${qs}` : "/found-pets");
  }

  function clear() {
    setCity("");
    setColor("");
    setSpecies(ALL);
    router.push("/found-pets");
  }

  return (
    <form
      onSubmit={apply}
      className="border-border bg-card grid gap-4 rounded-2xl border p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="space-y-1.5">
        <Label htmlFor="filter-city">Ciudad</Label>
        <Input
          id="filter-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ej. Medellín"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-species">Especie</Label>
        <Select value={species} onValueChange={setSpecies}>
          <SelectTrigger id="filter-species">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas</SelectItem>
            {SPECIES_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-color">Color</Label>
        <Input
          id="filter-color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="Ej. Negro"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          <Search className="size-4" />
          Buscar
        </Button>
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clear}
            aria-label="Limpiar filtros"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
