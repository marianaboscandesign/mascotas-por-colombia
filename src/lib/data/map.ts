import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { petPhotoUrl } from "@/lib/storage/pet-photos";
import { shelterImageUrl } from "@/lib/storage/shelters";
import {
  COLOMBIA_DEPARTMENT_COORDS,
  coordJitter,
} from "@/lib/constants/colombia-coords";
import { type ColombiaDepartmentEnum } from "@/types/database";
import { getLostPetUrl, getFoundPetUrl } from "@/lib/utils";
import { getLostPetRanks } from "@/lib/data/lost-pets";
import { getFoundPetRanks } from "@/lib/data/found-pets";

export type MapKind = "perdida" | "encontrada" | "refugio";

export interface MapMarker {
  id: string;
  kind: MapKind;
  title: string;
  subtitle: string;
  city: string;
  lat: number;
  lng: number;
  photoUrl: string | null;
  href: string;
}

const SPECIES_LABEL: Record<string, string> = {
  perro: "Perro",
  gato: "Gato",
  ave: "Ave",
  otro: "Otro",
};

const LIMIT = 500;

/**
 * Resuelve la posición de un marcador: usa las coordenadas GPS exactas si
 * existen; si no, cae al centroide del estado + un desplazamiento determinista
 * (para que las mascotas del mismo estado se dispersen). Devuelve null si no
 * hay forma de ubicarla (sin GPS ni estado válido).
 */
function resolveCoords(
  lat: number | null,
  lng: number | null,
  state: ColombiaDepartmentEnum | null,
  id: string,
): [number, number] | null {
  if (lat != null && lng != null) return [lat, lng];
  if (!state) return null;
  const center = COLOMBIA_DEPARTMENT_COORDS[state];
  if (!center) return null;
  const [dLat, dLng] = coordJitter(id);
  return [center[0] + dLat, center[1] + dLng];
}

/** Marcadores geolocalizados para el mapa: perdidas, encontradas y refugios. */
export async function getMapMarkers(): Promise<MapMarker[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();

  const petQuery = (table: "lost_pets" | "found_pets") =>
    supabase
      .from(table)
      .select(
        "id, name, species, color, city, state, latitude, longitude, photos",
      )
      .is("deleted_at", null)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(LIMIT);

  const [lost, found, shelters, ranksLost, ranksFound] = await Promise.all([
    petQuery("lost_pets"),
    petQuery("found_pets"),
    supabase
      .from("shelters")
      .select(
        "id, slug, name, city, state, latitude, longitude, logo_url, cover_url, photos",
      )
      .is("deleted_at", null)
      .eq("status", "verificado")
      .limit(LIMIT),
    getLostPetRanks(),
    getFoundPetRanks(),
  ]);

  const markers: MapMarker[] = [];

  for (const p of lost.data ?? []) {
    const pos = resolveCoords(p.latitude, p.longitude, p.state, p.id);
    if (!pos) continue;
    const rank = ranksLost.get(p.id) || 1;
    markers.push({
      id: p.id,
      kind: "perdida",
      title: p.name ?? "Mascota perdida",
      subtitle: [SPECIES_LABEL[p.species] ?? p.species, p.color]
        .filter(Boolean)
        .join(" · "),
      city: p.city ?? "",
      lat: pos[0],
      lng: pos[1],
      photoUrl: p.photos[0] ? petPhotoUrl(p.photos[0]) : null,
      href: getLostPetUrl({ ...p, rank }),
    });
  }

  for (const p of found.data ?? []) {
    const pos = resolveCoords(p.latitude, p.longitude, p.state, p.id);
    if (!pos) continue;
    const rank = ranksFound.get(p.id) || 1;
    markers.push({
      id: p.id,
      kind: "encontrada",
      title: p.name ?? "Mascota encontrada",
      subtitle: [SPECIES_LABEL[p.species] ?? p.species, p.color]
        .filter(Boolean)
        .join(" · "),
      city: p.city ?? "",
      lat: pos[0],
      lng: pos[1],
      photoUrl: p.photos[0] ? petPhotoUrl(p.photos[0]) : null,
      href: getFoundPetUrl({ ...p, rank }),
    });
  }

  for (const s of shelters.data ?? []) {
    const pos = resolveCoords(s.latitude, s.longitude, s.state, s.id);
    if (!pos) continue;
    const cover = s.cover_url ?? s.logo_url ?? s.photos[0] ?? null;
    markers.push({
      id: s.id,
      kind: "refugio",
      title: s.name,
      subtitle: "Refugio",
      city: s.city ?? "",
      lat: pos[0],
      lng: pos[1],
      photoUrl: cover ? shelterImageUrl(cover) : null,
      href: `/refugios/${s.slug}`,
    });
  }

  return markers;
}
