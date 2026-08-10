"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import { type MapKind, type MapMarker } from "@/lib/data/map";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const KIND_META: Record<MapKind, { label: string; color: string }> = {
  perdida: { label: "Perdidas", color: "#e8590c" },
  encontrada: { label: "Encontradas", color: "#0f766e" },
  refugio: { label: "Refugios", color: "#6d28d9" },
};

const ALL_KINDS = Object.keys(KIND_META) as MapKind[];
const COLOMBIA_CENTER: [number, number] = [4.6, -74.0];
const ALL_CITIES = "todas";

/** Pin de color tipo gota (divIcon), uno por categoría (memoizado). */
const PIN_ICONS: Partial<Record<MapKind, L.DivIcon>> = {};
function pinIcon(kind: MapKind): L.DivIcon {
  const cached = PIN_ICONS[kind];
  if (cached) return cached;
  const color = KIND_META[kind].color;
  const icon = L.divIcon({
    className: "pet-pin",
    html: `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.94 14 24 14 24s14-14.06 14-24C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="2.5"/>
      <circle cx="14" cy="14" r="5" fill="#fff"/>
    </svg>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -34],
  });
  PIN_ICONS[kind] = icon;
  return icon;
}

/** Ajusta el encuadre del mapa a los marcadores visibles. */
function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  React.useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [markers, map]);
  return null;
}

export function PetMap({ markers }: { markers: MapMarker[] }) {
  const [activeKinds, setActiveKinds] = React.useState<Set<MapKind>>(
    new Set(ALL_KINDS),
  );
  const [city, setCity] = React.useState<string>(ALL_CITIES);

  const cities = React.useMemo(
    () =>
      Array.from(new Set(markers.map((m) => m.city)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "es")),
    [markers],
  );

  const filtered = React.useMemo(
    () =>
      markers.filter(
        (m) =>
          activeKinds.has(m.kind) && (city === ALL_CITIES || m.city === city),
      ),
    [markers, activeKinds, city],
  );

  function toggleKind(kind: MapKind) {
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {ALL_KINDS.map((kind) => {
            const active = activeKinds.has(kind);
            const meta = KIND_META[kind];
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={active}
                onClick={() => toggleKind(kind)}
                className={cn(
                  "focus-visible:ring-ring inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  active
                    ? "border-transparent text-white"
                    : "border-border bg-background text-muted-foreground",
                )}
                style={active ? { backgroundColor: meta.color } : undefined}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: active ? "#fff" : meta.color }}
                />
                {meta.label}
              </button>
            );
          })}
        </div>

        <div className="sm:w-56">
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger aria-label="Filtrar por ciudad">
              <SelectValue placeholder="Todas las ciudades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CITIES}>Todas las ciudades</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-muted-foreground text-sm" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "ubicación" : "ubicaciones"}{" "}
        en el mapa
      </p>

      <div className="border-border h-[65vh] min-h-[420px] w-full overflow-hidden rounded-2xl border">
        <MapContainer
          center={COLOMBIA_CENTER}
          zoom={6}
          scrollWheelZoom={false}
          preferCanvas
          className="size-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds markers={filtered} />
          {filtered.map((m) => (
            <Marker
              key={`${m.kind}-${m.id}`}
              position={[m.lat, m.lng]}
              icon={pinIcon(m.kind)}
            >
              <Popup>
                <MarkerCard marker={m} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

function MarkerCard({ marker }: { marker: MapMarker }) {
  return (
    <div className="w-56">
      {marker.photoUrl && (
        <div className="relative mb-2 h-28 w-full overflow-hidden rounded-md bg-neutral-100">
          <Image
            src={marker.photoUrl}
            alt={marker.title}
            fill
            unoptimized
            sizes="224px"
            className="object-cover"
          />
        </div>
      )}
      <span
        className="mb-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
        style={{ backgroundColor: KIND_META[marker.kind].color }}
      >
        {KIND_META[marker.kind].label.replace(/s$/, "")}
      </span>
      <p className="text-sm font-semibold text-neutral-900">{marker.title}</p>
      {marker.subtitle && (
        <p className="text-xs text-neutral-600">{marker.subtitle}</p>
      )}
      <p className="text-xs text-neutral-600">{marker.city}</p>
      <Link
        href={marker.href}
        className="mt-2 inline-block text-sm font-semibold text-teal-700 underline"
      >
        Ver ficha
      </Link>
    </div>
  );
}
