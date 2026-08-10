import "server-only";

import { unstable_cache } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { REVALIDATE, TAGS } from "@/lib/cache/tags";
import { getLostPetRanks } from "./lost-pets";
import { getFoundPetRanks } from "./found-pets";
import { petPhotoUrl } from "@/lib/storage/pet-photos";
import { getSuccessStoryUrl } from "@/lib/utils";
import {
  type PetSexEnum,
  type PetSizeEnum,
  type PetSpeciesEnum,
  type ColombiaDepartmentEnum,
} from "@/types/database";

export type StoryKind = "perdida" | "encontrada";

export interface SuccessStory {
  id: string;
  kind: StoryKind;
  title: string;
  species: PetSpeciesEnum;
  city: string;
  state: ColombiaDepartmentEnum;
  photos: string[];
  photo: string | null;
  startDate: string | null; // perdida: last_seen_at · encontrada: found_at
  reunionDate: string | null; // resolved_at
  reportDate: string; // created_at
  daysMissing: number | null;
  reunionMessage: string | null;
  href: string;
}

export interface SuccessStoryDetail extends SuccessStory {
  description: string;
  breed: string | null;
  color: string | null;
  sex: PetSexEnum;
  size: PetSizeEnum;
}

const SPECIES_LABEL: Record<PetSpeciesEnum, string> = {
  perro: "Perro",
  gato: "Gato",
  ave: "Ave",
  otro: "Otro",
};

interface StoryRow {
  id: string;
  name: string | null;
  species: PetSpeciesEnum;
  breed: string | null;
  color: string | null;
  sex: PetSexEnum;
  size: PetSizeEnum;
  description: string;
  city: string;
  state: ColombiaDepartmentEnum;
  photos: string[];
  resolved_at: string | null;
  created_at: string;
  reunion_message: string | null;
  last_seen_at?: string | null;
  found_at?: string | null;
}

function daysBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const a = Date.parse(start);
  const b = Date.parse(end);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function toStory(row: StoryRow, kind: StoryKind, rank?: number): SuccessStory {
  const startDate =
    kind === "perdida" ? (row.last_seen_at ?? null) : (row.found_at ?? null);
  return {
    id: row.id,
    kind,
    title: row.name ?? `${SPECIES_LABEL[row.species]}`,
    species: row.species,
    city: row.city,
    state: row.state,
    photos: row.photos,
    photo: row.photos[0] ? petPhotoUrl(row.photos[0]) : null,
    startDate,
    reunionDate: row.resolved_at,
    reportDate: row.created_at,
    daysMissing: daysBetween(startDate, row.resolved_at),
    reunionMessage: row.reunion_message,
    href: getSuccessStoryUrl({
      id: row.id,
      title: row.name,
      species: row.species,
      city: row.city,
      rank,
    }),
  };
}

const LIST_COLS =
  "id, name, species, city, state, photos, resolved_at, created_at, reunion_message";
const DETAIL_COLS =
  "id, name, species, breed, color, sex, size, description, city, state, photos, resolved_at, created_at, reunion_message";

/** Todas las mascotas reunidas con su familia (perdidas + encontradas).
 * Cliente sin cookies + Data Cache (se invalida al marcar/editar reencuentros
 * → etiqueta `stories`, vía bustPets). */
export const getSuccessStories = unstable_cache(
  async (): Promise<SuccessStory[]> => {
    if (!isSupabaseConfigured) return [];

    const supabase = createPublicClient();
    const [lost, found, ranksLost, ranksFound] = await Promise.all([
      supabase
        .from("lost_pets")
        .select(`${LIST_COLS}, last_seen_at`)
        .is("deleted_at", null)
        .eq("status", "reunida")
        .order("resolved_at", { ascending: false }),
      supabase
        .from("found_pets")
        .select(`${LIST_COLS}, found_at`)
        .is("deleted_at", null)
        .eq("status", "reunida")
        .order("resolved_at", { ascending: false }),
      getLostPetRanks(),
      getFoundPetRanks(),
    ]);

    const stories = [
      ...((lost.data as unknown as StoryRow[]) ?? []).map((r) =>
        toStory(r, "perdida", ranksLost.get(r.id) || 1),
      ),
      ...((found.data as unknown as StoryRow[]) ?? []).map((r) =>
        toStory(r, "encontrada", ranksFound.get(r.id) || 1),
      ),
    ];
    stories.sort((a, b) =>
      (b.reunionDate ?? "") < (a.reunionDate ?? "") ? -1 : 1,
    );
    return stories;
  },
  ["success-stories"],
  { tags: [TAGS.stories], revalidate: REVALIDATE.content },
);

/** Últimas historias de reencuentro (portada). */
export async function getLatestSuccessStories(
  limit = 6,
): Promise<SuccessStory[]> {
  const all = await getSuccessStories();
  return all.slice(0, limit);
}

/** Una historia por id (busca en perdidas y encontradas). */
export async function getSuccessStoryById(
  idOrSlug: string,
): Promise<SuccessStoryDetail | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug,
    );

  if (isUuid) {
    const [lost, found, ranksLost, ranksFound] = await Promise.all([
      supabase
        .from("lost_pets")
        .select(`${DETAIL_COLS}, last_seen_at`)
        .eq("id", idOrSlug)
        .eq("status", "reunida")
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("found_pets")
        .select(`${DETAIL_COLS}, found_at`)
        .eq("id", idOrSlug)
        .eq("status", "reunida")
        .is("deleted_at", null)
        .maybeSingle(),
      getLostPetRanks(),
      getFoundPetRanks(),
    ]);

    if (lost.data)
      return toDetail(
        lost.data as unknown as StoryRow,
        "perdida",
        ranksLost.get(lost.data.id) || 1,
      );
    if (found.data)
      return toDetail(
        found.data as unknown as StoryRow,
        "encontrada",
        ranksFound.get(found.data.id) || 1,
      );

    return null;
  }

  // Es un slug. Buscamos si tiene el formato con sufijo numérico al final (ej: "-2")
  const match = idOrSlug.match(/(.+)-(\d+)$/);
  let baseSlug = idOrSlug;
  let targetRank = 1;
  if (match && match[1] && match[2]) {
    baseSlug = match[1];
    targetRank = parseInt(match[2], 10);
  }

  const [lostRes, foundRes, ranksLost, ranksFound] = await Promise.all([
    supabase
      .from("lost_pets")
      .select(`${DETAIL_COLS}, last_seen_at`)
      .eq("status", "reunida")
      .is("deleted_at", null),
    supabase
      .from("found_pets")
      .select(`${DETAIL_COLS}, found_at`)
      .eq("status", "reunida")
      .is("deleted_at", null),
    getLostPetRanks(),
    getFoundPetRanks(),
  ]);

  const slugifyLocal = (text: string) => {
    return text
      .toString()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const lostMatch = ((lostRes.data as unknown as StoryRow[]) ?? []).find(
    (story) => {
      const nameSlug = slugifyLocal(
        story.name ||
          (story.species === "perro"
            ? "perro"
            : story.species === "gato"
              ? "gato"
              : story.species === "ave"
                ? "ave"
                : "mascota"),
      );
      const citySlug = story.city
        ? slugifyLocal(story.city)
        : story.state
          ? slugifyLocal(story.state)
          : "";
      const slugParts = [nameSlug, citySlug].filter(Boolean);
      const candidateBase = slugParts.join("-");
      const petRank = ranksLost.get(story.id) || 1;
      return candidateBase === baseSlug && petRank === targetRank;
    },
  );
  if (lostMatch) return toDetail(lostMatch, "perdida", targetRank);

  const foundMatch = ((foundRes.data as unknown as StoryRow[]) ?? []).find(
    (story) => {
      const nameSlug = slugifyLocal(
        story.name ||
          (story.species === "perro"
            ? "perro"
            : story.species === "gato"
              ? "gato"
              : story.species === "ave"
                ? "ave"
                : "mascota"),
      );
      const citySlug = story.city
        ? slugifyLocal(story.city)
        : story.state
          ? slugifyLocal(story.state)
          : "";
      const slugParts = [nameSlug, citySlug].filter(Boolean);
      const candidateBase = slugParts.join("-");
      const petRank = ranksFound.get(story.id) || 1;
      return candidateBase === baseSlug && petRank === targetRank;
    },
  );
  if (foundMatch) return toDetail(foundMatch, "encontrada", targetRank);

  return null;
}

function toDetail(
  row: StoryRow,
  kind: StoryKind,
  rank?: number,
): SuccessStoryDetail {
  return {
    ...toStory(row, kind, rank),
    description: row.description,
    breed: row.breed,
    color: row.color,
    sex: row.sex,
    size: row.size,
  };
}
