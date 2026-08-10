"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const KINDS = [
  { value: "", label: "Todas" },
  { value: "perdida", label: "Perdidas" },
  { value: "encontrada", label: "Encontradas" },
];

const FILTERS = [
  { value: "activas", label: "Activas" },
  { value: "pendientes", label: "Pendientes" },
  { value: "reunidas", label: "Reunidas" },
];

export function ModerationToolbar() {
  const router = useRouter();
  const params = useSearchParams();
  const tipo = params.get("tipo") ?? "";
  const filtro = params.get("filtro") ?? "activas";
  const [q, setQ] = React.useState(params.get("q") ?? "");

  const update = React.useCallback(
    (next: Record<string, string>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, val] of Object.entries(next)) {
        if (val) sp.set(k, val);
        else sp.delete(k);
      }
      router.push(`/moderador/mascotas?${sp.toString()}`);
    },
    [params, router],
  );

  // Búsqueda con debounce.
  React.useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) update({ q });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o ciudad…"
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chips
          options={KINDS}
          value={tipo}
          onChange={(val) => update({ tipo: val })}
        />
        <span className="text-border hidden sm:inline">|</span>
        <Chips
          options={FILTERS}
          value={filtro}
          onChange={(val) => update({ filtro: val })}
        />
      </div>
    </div>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            value === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
