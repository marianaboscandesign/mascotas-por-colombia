import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { type PetSpeciesEnum } from "@/types/database";

export type ExternalPetKind = "perdida" | "encontrada";

export interface ExternalPetCandidate {
  id: string;
  kind: ExternalPetKind;
  name: string | null;
  city: string | null;
  photo: string | null;
  score: number;
  reasons: string[];
}

export interface ExternalPetReview {
  id: string;
  source: string;
  sourceUrl: string;
  kind: ExternalPetKind;
  species: PetSpeciesEnum;
  name: string | null;
  description: string;
  city: string | null;
  sector: string | null;
  photoUrl: string | null;
  contactUrl: string | null;
  publishedLabel: string | null;
  candidates: ExternalPetCandidate[];
}

/** Reportes externos con coincidencias que requieren una decisión humana. */
export async function getExternalPetReviews(): Promise<ExternalPetReview[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data: reports, error } = await supabase
    .from("external_pet_reports")
    .select("id,source,source_url,report_kind,species,name,description,city,sector,source_photo_url,source_contact_url,source_published_label")
    .eq("review_status", "pendiente")
    .order("created_at", { ascending: false });
  if (error || !reports?.length) return [];

  const reportIds = reports.map((report) => report.id);
  const { data: candidateRows } = await supabase
    .from("external_pet_candidates")
    .select("external_report_id,pet_kind,pet_id,score,reasons")
    .in("external_report_id", reportIds)
    .order("score", { ascending: false });

  const lostIds = (candidateRows ?? []).filter((row) => row.pet_kind === "perdida").map((row) => row.pet_id);
  const foundIds = (candidateRows ?? []).filter((row) => row.pet_kind === "encontrada").map((row) => row.pet_id);
  const [lost, found] = await Promise.all([
    lostIds.length ? supabase.from("lost_pets").select("id,name,city,photos").in("id", lostIds) : Promise.resolve({ data: [] }),
    foundIds.length ? supabase.from("found_pets").select("id,name,city,photos").in("id", foundIds) : Promise.resolve({ data: [] }),
  ]);
  const pets = new Map<string, { name: string | null; city: string | null; photos: string[] }>();
  for (const pet of [...(lost.data ?? []), ...(found.data ?? [])]) pets.set(pet.id, pet);

  return reports.map((report) => ({
    id: report.id,
    source: report.source,
    sourceUrl: report.source_url,
    kind: report.report_kind,
    species: report.species,
    name: report.name,
    description: report.description,
    city: report.city,
    sector: report.sector,
    photoUrl: report.source_photo_url,
    contactUrl: report.source_contact_url,
    publishedLabel: report.source_published_label,
    candidates: (candidateRows ?? [])
      .filter((candidate) => candidate.external_report_id === report.id)
      .flatMap((candidate) => {
        const pet = pets.get(candidate.pet_id);
        if (!pet) return [];
        return [{
          id: candidate.pet_id,
          kind: candidate.pet_kind,
          name: pet.name,
          city: pet.city,
          photo: pet.photos[0] ?? null,
          score: Number(candidate.score),
          reasons: candidate.reasons,
        }];
      }),
  }));
}
