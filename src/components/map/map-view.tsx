"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

import { type MapMarker } from "@/lib/data/map";

// Leaflet depende del DOM: se carga solo en el navegador.
const PetMap = dynamic(() => import("./pet-map").then((m) => m.PetMap), {
  ssr: false,
  loading: () => (
    <div className="border-border bg-muted/30 grid h-[65vh] min-h-[420px] place-items-center rounded-2xl border">
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
    </div>
  ),
});

export function MapView({ markers }: { markers: MapMarker[] }) {
  return <PetMap markers={markers} />;
}
