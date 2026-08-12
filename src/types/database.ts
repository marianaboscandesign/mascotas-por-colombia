/**
 * Tipos de la base de datos Supabase.
 *
 * Idealmente se regeneran con:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 *
 * Mientras tanto, definimos a mano las tablas/enums ya implementadas para que
 * el cliente tipado funcione. Por ahora: `lost_pets` (módulo Mascotas Perdidas).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Enums ─────────────────────────────────────────────────────────
export type PetSpeciesEnum = "perro" | "gato" | "ave" | "otro";
export type PetSexEnum = "macho" | "hembra" | "desconocido";
export type PetSizeEnum = "pequeno" | "mediano" | "grande";
export type PetAgeGroupEnum = "cachorro" | "joven" | "adulto" | "senior";
export type LostPetStatusEnum = "activa" | "encontrada" | "cerrada" | "reunida";
export type FoundPetStatusEnum =
  | "en_resguardo"
  | "en_la_calle"
  | "reunida"
  | "derivada"
  | "cerrada";
export type RescuedPetStatusEnum =
  | "en_tratamiento"
  | "en_adopcion"
  | "adoptada"
  | "fallecida";

export type AdminRoleEnum = "super_admin" | "editor" | "moderador";
export type NewsStatusEnum = "borrador" | "publicado" | "archivado";
export type NewsCategoryEnum =
  | "rescates"
  | "adopciones"
  | "campanas"
  | "consejos"
  | "eventos"
  | "comunidad";
export type VolunteerStatusEnum = "pendiente" | "activo" | "inactivo";
export type ShelterStatusEnum = "pendiente" | "verificado" | "suspendido";
export type ShelterKindEnum = "refugio" | "centro_acopio" | "ambos";
export type ShelterNeedEnum =
  | "alimento"
  | "agua"
  | "medicinas"
  | "mantas"
  | "casas_temporales"
  | "transporte"
  | "veterinarios"
  | "donaciones"
  | "perrarina"
  | "gatarina"
  | "correas"
  | "kennels"
  | "guantes"
  | "gasas"
  | "vendas"
  | "arena_gatos"
  | "productos_limpieza"
  | "camas"
  | "accesorios";

/** Discriminador del buscador global. */
export type SearchableKind = "perdida" | "encontrada" | "rescatada";
export type ColombiaDepartmentEnum =
  | "Amazonas"
  | "Antioquia"
  | "Arauca"
  | "Atlántico"
  | "Bogotá D.C."
  | "Bolívar"
  | "Boyacá"
  | "Caldas"
  | "Caquetá"
  | "Casanare"
  | "Cauca"
  | "Cesar"
  | "Chocó"
  | "Córdoba"
  | "Cundinamarca"
  | "Guainía"
  | "Guaviare"
  | "Huila"
  | "La Guajira"
  | "Magdalena"
  | "Meta"
  | "Nariño"
  | "Norte de Santander"
  | "Putumayo"
  | "Quindío"
  | "Risaralda"
  | "San Andrés y Providencia"
  | "Santander"
  | "Sucre"
  | "Tolima"
  | "Valle del Cauca"
  | "Vaupés"
  | "Vichada";

type LostPetRow = {
  id: string;
  name: string | null;
  species: PetSpeciesEnum;
  breed: string | null;
  color: string | null;
  sex: PetSexEnum;
  size: PetSizeEnum;
  age_group: PetAgeGroupEnum | null;
  description: string | null;
  distinctive_marks: string | null;
  photos: string[];
  status: LostPetStatusEnum;
  last_seen_at: string | null;
  state: ColombiaDepartmentEnum;
  city: string | null;
  sector: string | null;
  latitude: number | null;
  longitude: number | null;
  has_reward: boolean;
  reporter_name: string | null;
  reporter_email: string | null;
  reporter_phone: string | null;
  reporter_whatsapp: string | null;
  reported_by: string | null;
  resolved_at: string | null;
  reunion_message: string | null;
  is_approved: boolean;
  is_featured: boolean;
  is_imported: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type LostPetInsert = {
  id?: string;
  name?: string | null;
  species: PetSpeciesEnum;
  breed?: string | null;
  color?: string | null;
  sex?: PetSexEnum;
  size?: PetSizeEnum;
  age_group?: PetAgeGroupEnum | null;
  description?: string | null;
  distinctive_marks?: string | null;
  photos?: string[];
  status?: LostPetStatusEnum;
  last_seen_at?: string | null;
  state: ColombiaDepartmentEnum;
  city?: string | null;
  sector?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  has_reward?: boolean;
  reporter_name?: string | null;
  reporter_email?: string | null;
  reporter_phone?: string | null;
  reporter_whatsapp?: string | null;
  reported_by?: string | null;
  resolved_at?: string | null;
  reunion_message?: string | null;
  is_approved?: boolean;
  is_featured?: boolean;
  is_imported?: boolean;
};

type FoundPetRow = {
  id: string;
  name: string | null;
  species: PetSpeciesEnum;
  breed: string | null;
  color: string | null;
  sex: PetSexEnum;
  size: PetSizeEnum;
  age_group: PetAgeGroupEnum | null;
  description: string | null;
  distinctive_marks: string | null;
  photos: string[];
  video_path: string | null;
  status: FoundPetStatusEnum;
  found_at: string | null;
  state: ColombiaDepartmentEnum;
  city: string | null;
  sector: string | null;
  latitude: number | null;
  longitude: number | null;
  health_status: string | null;
  is_sheltered: boolean;
  shelter_id: string | null;
  matched_lost_pet_id: string | null;
  finder_name: string | null;
  finder_email: string | null;
  finder_phone: string | null;
  finder_whatsapp: string | null;
  reported_by: string | null;
  resolved_at: string | null;
  reunion_message: string | null;
  is_approved: boolean;
  is_featured: boolean;
  is_imported: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type FoundPetInsert = {
  id?: string;
  name?: string | null;
  species: PetSpeciesEnum;
  breed?: string | null;
  color?: string | null;
  sex?: PetSexEnum;
  size?: PetSizeEnum;
  age_group?: PetAgeGroupEnum | null;
  description?: string | null;
  distinctive_marks?: string | null;
  photos?: string[];
  video_path?: string | null;
  status?: FoundPetStatusEnum;
  found_at?: string | null;
  state: ColombiaDepartmentEnum;
  city?: string | null;
  sector?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  health_status?: string | null;
  is_sheltered?: boolean;
  shelter_id?: string | null;
  matched_lost_pet_id?: string | null;
  finder_name?: string | null;
  finder_email?: string | null;
  finder_phone?: string | null;
  finder_whatsapp?: string | null;
  reported_by?: string | null;
  resolved_at?: string | null;
  reunion_message?: string | null;
  is_approved?: boolean;
  is_featured?: boolean;
  is_imported?: boolean;
};

type ExternalPetReportRow = {
  id: string;
  source: string;
  source_key: string;
  source_url: string;
  report_kind: "perdida" | "encontrada";
  species: PetSpeciesEnum;
  name: string | null;
  description: string;
  city: string | null;
  sector: string | null;
  source_photo_url: string | null;
  source_contact_url: string | null;
  source_published_label: string | null;
  raw_payload: Json;
  review_status:
    | "pendiente"
    | "publicada"
    | "duplicada"
    | "descartada"
    | "requiere_datos";
  published_pet_kind: "perdida" | "encontrada" | null;
  published_pet_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ExternalPetReportInsert = Omit<
  ExternalPetReportRow,
  "id" | "created_at" | "updated_at" | "review_status"
> & {
  review_status?: ExternalPetReportRow["review_status"];
};

type ExternalPetCandidateRow = {
  id: string;
  external_report_id: string;
  pet_kind: "perdida" | "encontrada";
  pet_id: string;
  score: number;
  reasons: string[];
  created_at: string;
};

type ExternalPetCandidateInsert = Omit<ExternalPetCandidateRow, "id" | "created_at">;

type RescuedPetRow = {
  id: string;
  shelter_id: string;
  name: string | null;
  species: PetSpeciesEnum;
  breed: string | null;
  color: string | null;
  sex: PetSexEnum;
  size: PetSizeEnum;
  age_group: PetAgeGroupEnum | null;
  description: string;
  photos: string[];
  rescued_at: string;
  state: ColombiaDepartmentEnum | null;
  city: string | null;
  health_status: string | null;
  medical_notes: string | null;
  is_adoptable: boolean;
  status: RescuedPetStatusEnum;
  rescued_by_volunteer_id: string | null;
  origin_found_pet_id: string | null;
  adopted_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_imported: boolean;
};

type RescuedPetInsert = {
  id?: string;
  shelter_id: string;
  name?: string | null;
  species: PetSpeciesEnum;
  breed?: string | null;
  color?: string | null;
  sex?: PetSexEnum;
  size?: PetSizeEnum;
  age_group?: PetAgeGroupEnum | null;
  description: string;
  photos?: string[];
  rescued_at?: string;
  state?: ColombiaDepartmentEnum | null;
  city?: string | null;
  health_status?: string | null;
  medical_notes?: string | null;
  is_adoptable?: boolean;
  status?: RescuedPetStatusEnum;
  rescued_by_volunteer_id?: string | null;
  origin_found_pet_id?: string | null;
  adopted_at?: string | null;
  is_imported?: boolean;
};

type SearchablePetRow = {
  id: string;
  kind: SearchableKind;
  name: string | null;
  species: PetSpeciesEnum;
  breed: string | null;
  color: string | null;
  sex: PetSexEnum;
  size: PetSizeEnum;
  status: string;
  state: ColombiaDepartmentEnum | null;
  city: string | null;
  photos: string[];
  created_at: string;
  is_featured: boolean;
  is_imported: boolean;
};

type ShelterRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  state: ColombiaDepartmentEnum | null;
  city: string;
  address: string | null;
  country: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  current_occupancy: number;
  logo_url: string | null;
  cover_url: string | null;
  photos: string[];
  manager_name: string | null;
  schedule: string | null;
  social: Json;
  needs: ShelterNeedEnum[];
  kind: ShelterKindEnum;
  status: ShelterStatusEnum;
  verified_at: string | null;
  managed_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ShelterInsert = {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  state?: ColombiaDepartmentEnum | null;
  city: string;
  address?: string | null;
  country?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  capacity?: number | null;
  current_occupancy?: number;
  logo_url?: string | null;
  cover_url?: string | null;
  photos?: string[];
  manager_name?: string | null;
  schedule?: string | null;
  social?: Json;
  needs?: ShelterNeedEnum[];
  kind?: ShelterKindEnum;
  status?: ShelterStatusEnum;
  verified_at?: string | null;
  managed_by?: string | null;
  deleted_at?: string | null;
};

type FreeVetServiceRow = {
  id: string;
  name: string;
  description: string | null;
  city: string;
  state: ColombiaDepartmentEnum | null;
  region: string | null;
  sedes: string[];
  phones: string[];
  whatsapp: string | null;
  address: string | null;
  schedule: string | null;
  source: string | null;
  valid_until: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type FreeVetServiceInsert = {
  id?: string;
  name: string;
  description?: string | null;
  city: string;
  state?: ColombiaDepartmentEnum | null;
  region?: string | null;
  sedes?: string[];
  phones?: string[];
  whatsapp?: string | null;
  address?: string | null;
  schedule?: string | null;
  source?: string | null;
  valid_until?: string | null;
  is_published?: boolean;
  deleted_at?: string | null;
};

type SocialPetRow = {
  id: string;
  video_url: string;
  species: PetSpeciesEnum | null;
  title: string | null;
  state: ColombiaDepartmentEnum | null;
  city: string | null;
  note: string | null;
  is_published: boolean;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type SocialPetInsert = {
  id?: string;
  video_url: string;
  species?: PetSpeciesEnum | null;
  title?: string | null;
  state?: ColombiaDepartmentEnum | null;
  city?: string | null;
  note?: string | null;
  is_published?: boolean;
  is_resolved?: boolean;
  deleted_at?: string | null;
};

type ContactMessageRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

type ContactMessageInsert = {
  id?: string;
  name: string;
  phone: string;
  email?: string | null;
  subject?: string | null;
  message: string;
  is_read?: boolean;
};

type DonationOrgRow = {
  id: string;
  name: string;
  url: string;
  url_label: string;
  instagram: string | null;
  description: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type DonationOrgInsert = {
  id?: string;
  name: string;
  url: string;
  url_label: string;
  instagram?: string | null;
  description: string;
  sort_order?: number;
  is_published?: boolean;
  updated_at?: string;
  deleted_at?: string | null;
};

type ActivityLogRow = {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  summary: string;
  table_name: string;
  record_id: string | null;
  old_value: Json | null;
  new_value: Json | null;
  created_at: string;
};

type ActivityLogInsert = {
  id?: string;
  actor_id?: string | null;
  actor_name: string;
  action: string;
  summary: string;
  table_name: string;
  record_id?: string | null;
  old_value?: Json | null;
  new_value?: Json | null;
};

type AdministratorRow = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: AdminRoleEnum;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type AdministratorInsert = {
  id?: string;
  user_id: string;
  full_name: string;
  email: string;
  role?: AdminRoleEnum;
  is_active?: boolean;
  last_login_at?: string | null;
};

type VolunteerRow = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  state: ColombiaDepartmentEnum;
  city: string | null;
  skills: string[];
  profession: string | null;
  availability: string | null;
  bio: string | null;
  shelter_id: string | null;
  status: VolunteerStatusEnum;
  public_listing: boolean;
  public_contact: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type PublicVolunteerRow = {
  id: string;
  full_name: string;
  profession: string | null;
  state: ColombiaDepartmentEnum;
  city: string | null;
  skills: string[];
  availability: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  created_at: string;
};

type VolunteerInsert = {
  id?: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  state: ColombiaDepartmentEnum;
  city?: string | null;
  skills?: string[];
  profession?: string | null;
  availability?: string | null;
  bio?: string | null;
  shelter_id?: string | null;
  status?: VolunteerStatusEnum;
  public_listing?: boolean;
  public_contact?: string[];
  deleted_at?: string | null;
};

type NewsRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  tags: string[];
  category: NewsCategoryEnum;
  is_featured: boolean;
  status: NewsStatusEnum;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type NewsInsert = {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_url?: string | null;
  tags?: string[];
  category?: NewsCategoryEnum;
  is_featured?: boolean;
  status?: NewsStatusEnum;
  published_at?: string | null;
  author_id?: string | null;
  deleted_at?: string | null;
};

export interface Database {
  public: {
    Tables: {
      news: {
        Row: NewsRow;
        Insert: NewsInsert;
        Update: Partial<NewsInsert>;
        Relationships: [];
      };
      administrators: {
        Row: AdministratorRow;
        Insert: AdministratorInsert;
        Update: Partial<AdministratorInsert>;
        Relationships: [];
      };
      shelters: {
        Row: ShelterRow;
        Insert: ShelterInsert;
        Update: Partial<ShelterInsert>;
        Relationships: [];
      };
      volunteers: {
        Row: VolunteerRow;
        Insert: VolunteerInsert;
        Update: Partial<VolunteerInsert>;
        Relationships: [];
      };
      lost_pets: {
        Row: LostPetRow;
        Insert: LostPetInsert;
        Update: Partial<LostPetInsert>;
        Relationships: [];
      };
      found_pets: {
        Row: FoundPetRow;
        Insert: FoundPetInsert;
        Update: Partial<FoundPetInsert>;
        Relationships: [];
      };
      external_pet_reports: {
        Row: ExternalPetReportRow;
        Insert: ExternalPetReportInsert;
        Update: Partial<ExternalPetReportInsert>;
        Relationships: [];
      };
      external_pet_candidates: {
        Row: ExternalPetCandidateRow;
        Insert: ExternalPetCandidateInsert;
        Update: Partial<ExternalPetCandidateInsert>;
        Relationships: [];
      };
      rescued_pets: {
        Row: RescuedPetRow;
        Insert: RescuedPetInsert;
        Update: Partial<RescuedPetInsert>;
        Relationships: [];
      };
      free_vet_services: {
        Row: FreeVetServiceRow;
        Insert: FreeVetServiceInsert;
        Update: Partial<FreeVetServiceInsert>;
        Relationships: [];
      };
      social_pets: {
        Row: SocialPetRow;
        Insert: SocialPetInsert;
        Update: Partial<SocialPetInsert>;
        Relationships: [];
      };
      contact_messages: {
        Row: ContactMessageRow;
        Insert: ContactMessageInsert;
        Update: Partial<ContactMessageInsert>;
        Relationships: [];
      };
      donation_orgs: {
        Row: DonationOrgRow;
        Insert: DonationOrgInsert;
        Update: Partial<DonationOrgInsert>;
        Relationships: [];
      };
      activity_log: {
        Row: ActivityLogRow;
        Insert: ActivityLogInsert;
        Update: Partial<ActivityLogInsert>;
        Relationships: [];
      };
    };
    Views: {
      searchable_pets: {
        Row: SearchablePetRow;
        Relationships: [];
      };
      public_volunteers: {
        Row: PublicVolunteerRow;
        Relationships: [];
      };
    };
    Functions: {
      mark_pet_reunited: {
        Args: { p_kind: string; p_id: string; p_message?: string | null };
        Returns: boolean;
      };
      get_home_stats: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
    Enums: {
      pet_species: PetSpeciesEnum;
      pet_sex: PetSexEnum;
      pet_size: PetSizeEnum;
      pet_age_group: PetAgeGroupEnum;
      lost_pet_status: LostPetStatusEnum;
      found_pet_status: FoundPetStatusEnum;
      rescued_pet_status: RescuedPetStatusEnum;
      admin_role: AdminRoleEnum;
      news_status: NewsStatusEnum;
      news_category: NewsCategoryEnum;
      volunteer_status: VolunteerStatusEnum;
      shelter_status: ShelterStatusEnum;
      shelter_kind: ShelterKindEnum;
      shelter_need: ShelterNeedEnum;
      colombia_department: ColombiaDepartmentEnum;
    };
    CompositeTypes: Record<string, never>;
  };
}
