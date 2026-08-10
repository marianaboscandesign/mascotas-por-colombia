import type { Metadata } from "next";

import { getMapMarkers } from "@/lib/data/map";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/common/page-header";
import { MapView } from "@/components/map/map-view";

export const metadata: Metadata = {
  alternates: { canonical: "/mapa" },
  title: "Mapa",
  description:
    "Mapa interactivo de mascotas perdidas, encontradas y refugios en Colombia. Filtra por ciudad y categoría.",
};

export default async function MapPage() {
  const markers = await getMapMarkers();

  return (
    <>
      <PageHeader
        eyebrow="Mapa"
        title="Mapa interactivo"
        description="Explora en el mapa las mascotas perdidas y encontradas, y los refugios cercanos. Toca un marcador para ver los detalles."
      />
      <Container className="py-10 lg:py-14">
        <MapView markers={markers} />
      </Container>
    </>
  );
}
