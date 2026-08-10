"use client";

import * as React from "react";
import { Pencil, Check, Loader2, AlertCircle, X } from "lucide-react";
import { updatePetFromFrontend, type EditablePetData } from "@/app/actions/frontend-edit";
import { useFrontendEditAuth } from "@/hooks/use-frontend-edit-auth";

interface InitialPetData {
  name?: string | null;
  species?: string | null;
  breed?: string | null;
  color?: string | null;
  sex?: string | null;
  size?: string | null;
  age_group?: string | null;
  description?: string | null;
  distinctive_marks?: string | null;
  status?: string | null;
  state?: string | null;
  city?: string | null;
  sector?: string | null;
  is_approved?: boolean;
  is_featured?: boolean;
  last_seen_at?: string | null;
  found_at?: string | null;
  reporter_name?: string | null;
  reporter_email?: string | null;
  reporter_phone?: string | null;
  reporter_whatsapp?: string | null;
  finder_name?: string | null;
  finder_email?: string | null;
  finder_phone?: string | null;
  finder_whatsapp?: string | null;
  has_reward?: boolean;
  is_sheltered?: boolean;
}

interface EditButtonProps {
  id: string;
  kind: "perdida" | "encontrada";
  initialData: InitialPetData;
}

interface FormValues {
  name: string;
  species: string;
  breed: string;
  color: string;
  sex: string;
  size: string;
  age_group: string;
  description: string;
  distinctive_marks: string;
  status: string;
  state: string;
  city: string;
  sector: string;
  is_approved: boolean;
  is_featured: boolean;
  date: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;
  has_reward: boolean;
  is_sheltered: boolean;
}

const COLOMBIA_DEPARTMENTS = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar",
  "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó",
  "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira",
  "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío",
  "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima",
  "Valle del Cauca", "Vaupés", "Vichada"
];

const SPECIES = [
  { value: "perro", label: "Perro" },
  { value: "gato", label: "Gato" },
  { value: "ave", label: "Ave" },
  { value: "otro", label: "Otro" }
];

const SEXES = [
  { value: "macho", label: "Macho" },
  { value: "hembra", label: "Hembra" },
  { value: "desconocido", label: "Desconocido" }
];

const SIZES = [
  { value: "pequeno", label: "Pequeño" },
  { value: "mediano", label: "Mediano" },
  { value: "grande", label: "Grande" }
];

const AGES = [
  { value: "", label: "No especificado" },
  { value: "cachorro", label: "Cachorro" },
  { value: "joven", label: "Joven" },
  { value: "adulto", label: "Adulto" },
  { value: "senior", label: "Senior" }
];

export function FrontendEditButton({ id, kind, initialData }: EditButtonProps) {
  const isAuthenticated = useFrontendEditAuth();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "ok" | "error";
    message: string;
  } | null>(null);

  const [values, setValues] = React.useState<FormValues>({
    name: "",
    species: "perro",
    breed: "",
    color: "",
    sex: "desconocido",
    size: "mediano",
    age_group: "",
    description: "",
    distinctive_marks: "",
    status: "",
    state: "Bogotá D.C.",
    city: "",
    sector: "",
    is_approved: false,
    is_featured: false,
    date: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    contact_whatsapp: "",
    has_reward: false,
    is_sheltered: false,
  });

  // Initialize values from initialData when modal opens or initialData changes
  const initForm = React.useCallback(() => {
    setValues({
      name: initialData.name ?? "",
      species: initialData.species ?? "perro",
      breed: initialData.breed ?? "",
      color: initialData.color ?? "",
      sex: initialData.sex ?? "desconocido",
      size: initialData.size ?? "mediano",
      age_group: initialData.age_group ?? "",
      description: initialData.description ?? "",
      distinctive_marks: initialData.distinctive_marks ?? "",
      status: initialData.status ?? "",
      state: initialData.state ?? "Bogotá D.C.",
      city: initialData.city ?? "",
      sector: initialData.sector ?? "",
      is_approved: initialData.is_approved ?? false,
      is_featured: initialData.is_featured ?? false,
      date: initialData.last_seen_at ? initialData.last_seen_at.slice(0, 10) : (initialData.found_at ? initialData.found_at.slice(0, 10) : ""),
      contact_name: initialData.reporter_name ?? initialData.finder_name ?? "",
      contact_email: initialData.reporter_email ?? initialData.finder_email ?? "",
      contact_phone: initialData.reporter_phone ?? initialData.finder_phone ?? "",
      contact_whatsapp: initialData.reporter_whatsapp ?? initialData.finder_whatsapp ?? "",
      has_reward: initialData.has_reward ?? false,
      is_sheltered: initialData.is_sheltered ?? false,
    });
  }, [initialData]);

  React.useEffect(() => {
    initForm();
  }, [initForm]);

  if (!isAuthenticated) return null;

  const handleOpenEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFeedback(null);
    initForm();
    setModalOpen(true);
  };

  const handleCloseEdit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setModalOpen(false);
  };

  const handleChange = (key: keyof FormValues, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    setFeedback(null);

    const savedPassword = localStorage.getItem("frontend_edit_password") ?? "";

    const payload: EditablePetData = {
      name: values.name?.trim() || null,
      species: values.species as "perro" | "gato" | "ave" | "otro",
      breed: values.breed?.trim() || null,
      color: values.color?.trim() || null,
      sex: values.sex as "macho" | "hembra" | "desconocido",
      size: values.size as "pequeno" | "mediano" | "grande",
      age_group: (values.age_group || null) as "cachorro" | "joven" | "adulto" | "senior" | null,
      description: values.description?.trim() || null,
      distinctive_marks: values.distinctive_marks?.trim() || null,
      status: values.status,
      state: values.state,
      city: values.city?.trim() || null,
      sector: values.sector?.trim() || null,
      is_approved: values.is_approved,
      is_featured: values.is_featured,
    };

    if (kind === "perdida") {
      payload.last_seen_at = values.date || null;
      payload.reporter_name = values.contact_name?.trim() || null;
      payload.reporter_email = values.contact_email?.trim() || null;
      payload.reporter_phone = values.contact_phone?.trim() || null;
      payload.reporter_whatsapp = values.contact_whatsapp?.trim() || null;
      payload.has_reward = values.has_reward;
    } else {
      payload.found_at = values.date || null;
      payload.finder_name = values.contact_name?.trim() || null;
      payload.finder_email = values.contact_email?.trim() || null;
      payload.finder_phone = values.contact_phone?.trim() || null;
      payload.finder_whatsapp = values.contact_whatsapp?.trim() || null;
      payload.is_sheltered = values.is_sheltered;
    }

    const res = await updatePetFromFrontend(id, kind, payload, savedPassword);

    setSaving(false);
    if (!res.success) {
      setFeedback({ type: "error", message: res.error || "Error al actualizar" });
    } else {
      setFeedback({ type: "ok", message: "Mascota actualizada correctamente" });
      setTimeout(() => {
        setModalOpen(false);
      }, 1000);
    }
  };

  const STATUSES = kind === "perdida" 
    ? [
        { value: "activa", label: "Activa" },
        { value: "encontrada", label: "Encontrada" },
        { value: "cerrada", label: "Cerrada" },
        { value: "reunida", label: "Reunida" }
      ]
    : [
        { value: "en_resguardo", label: "En resguardo" },
        { value: "en_la_calle", label: "En la calle" },
        { value: "reunida", label: "Reunida" },
        { value: "derivada", label: "Derivada" },
        { value: "cerrada", label: "Cerrada" }
      ];

  return (
    <>
      <button
        onClick={handleOpenEdit}
        className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-foreground border border-border shadow-md hover:bg-white hover:scale-105 active:scale-95 transition-all z-20 pointer-events-auto"
        aria-label="Editar mascota"
      >
        <Pencil className="size-3 text-primary" />
        Editar
      </button>

      {modalOpen && (
        <div 
          onClick={handleCloseEdit}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in cursor-default"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="border-border bg-card w-full max-w-2xl rounded-2xl border p-6 shadow-xl animate-in zoom-in-95 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
                <Pencil className="size-5 text-primary" />
                Editar mascota ({kind === "perdida" ? "Perdida" : "Encontrada"})
              </h3>
              <button
                onClick={handleCloseEdit}
                className="rounded-full bg-muted p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto my-4 pr-2 space-y-6 text-left scrollbar-thin">
              
              {/* SECTION 1: DATOS DE LA MASCOTA */}
              <div className="space-y-4">
                <h4 className="font-heading text-sm font-semibold text-primary border-b pb-1">1. Datos de la Mascota</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-name">Nombre</label>
                    <input
                      id="edit-name"
                      value={values.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      placeholder="Ej. Firulais"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-species">Especie</label>
                    <select
                      id="edit-species"
                      value={values.species}
                      onChange={(e) => handleChange("species", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {SPECIES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-sex">Sexo</label>
                    <select
                      id="edit-sex"
                      value={values.sex}
                      onChange={(e) => handleChange("sex", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {SEXES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-size">Tamaño</label>
                    <select
                      id="edit-size"
                      value={values.size}
                      onChange={(e) => handleChange("size", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {SIZES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-age">Grupo de edad</label>
                    <select
                      id="edit-age"
                      value={values.age_group}
                      onChange={(e) => handleChange("age_group", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {AGES.map((a) => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-breed">Raza</label>
                    <input
                      id="edit-breed"
                      value={values.breed}
                      onChange={(e) => handleChange("breed", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      placeholder="Ej. Poodle"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-color">Color</label>
                    <input
                      id="edit-color"
                      value={values.color}
                      onChange={(e) => handleChange("color", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      placeholder="Ej. Blanco con manchas negras"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-marks">Marcas Distintivas</label>
                    <input
                      id="edit-marks"
                      value={values.distinctive_marks}
                      onChange={(e) => handleChange("distinctive_marks", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      placeholder="Cicatriz, collar, cola recortada..."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: UBICACION Y FECHA */}
              <div className="space-y-4">
                <h4 className="font-heading text-sm font-semibold text-primary border-b pb-1">2. Ubicación y Fecha</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-state">Estado</label>
                    <select
                      id="edit-state"
                      value={values.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {COLOMBIA_DEPARTMENTS.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-city">Ciudad</label>
                    <input
                      id="edit-city"
                      value={values.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      placeholder="Ej. Bogotá"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-sector">Sector / Zona</label>
                    <input
                      id="edit-sector"
                      value={values.sector}
                      onChange={(e) => handleChange("sector", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      placeholder="Ej. Altamira sur"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-date">
                      {kind === "perdida" ? "Fecha de desaparición" : "Fecha de hallazgo"}
                    </label>
                    <input
                      id="edit-date"
                      type="date"
                      value={values.date}
                      onChange={(e) => handleChange("date", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: CONTACTO */}
              <div className="space-y-4">
                <h4 className="font-heading text-sm font-semibold text-primary border-b pb-1">3. Datos de Contacto</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-contact-name">Nombre de contacto</label>
                    <input
                      id="edit-contact-name"
                      value={values.contact_name}
                      onChange={(e) => handleChange("contact_name", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-contact-phone">Teléfono</label>
                    <input
                      id="edit-contact-phone"
                      value={values.contact_phone}
                      onChange={(e) => handleChange("contact_phone", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      placeholder="Ej. +57 300 1234567"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-contact-whatsapp">WhatsApp</label>
                    <input
                      id="edit-contact-whatsapp"
                      value={values.contact_whatsapp}
                      onChange={(e) => handleChange("contact_whatsapp", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      placeholder="Ej. +573001234567"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-contact-email">Correo</label>
                    <input
                      id="edit-contact-email"
                      type="email"
                      value={values.contact_email}
                      onChange={(e) => handleChange("contact_email", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: DESCRIPCION */}
              <div className="space-y-4">
                <h4 className="font-heading text-sm font-semibold text-primary border-b pb-1">4. Descripción</h4>
                <div className="space-y-1.5">
                  <textarea
                    id="edit-description"
                    rows={4}
                    value={values.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="border-input bg-background focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none resize-none"
                    placeholder="Detalles sobre el extravío o el resguardo de la mascota..."
                  />
                </div>
              </div>

              {/* SECTION 5: ESTATUS Y BANDERAS */}
              <div className="space-y-4">
                <h4 className="font-heading text-sm font-semibold text-primary border-b pb-1">5. Estatus y Configuración</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="edit-status">Estatus</label>
                    <select
                      id="edit-status"
                      value={values.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {STATUSES.map((st) => (
                        <option key={st.value} value={st.value}>{st.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col justify-center gap-3 pt-4 sm:pt-6">
                    {kind === "perdida" ? (
                      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={values.has_reward}
                          onChange={(e) => handleChange("has_reward", e.target.checked)}
                          className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span>Ofrece recompensa</span>
                      </label>
                    ) : (
                      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={values.is_sheltered}
                          onChange={(e) => handleChange("is_sheltered", e.target.checked)}
                          className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span>Está en resguardo</span>
                      </label>
                    )}

                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={values.is_approved}
                        onChange={(e) => handleChange("is_approved", e.target.checked)}
                        className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>Reporte aprobado</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={values.is_featured}
                        onChange={(e) => handleChange("is_featured", e.target.checked)}
                        className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>Caso urgente / destacado</span>
                    </label>
                  </div>
                </div>
              </div>

              {feedback && (
                <div
                  role="alert"
                  className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
                    feedback.type === "ok"
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }`}
                >
                  {feedback.type === "ok" ? (
                    <Check className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  )}
                  <p>{feedback.message}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="border-input hover:bg-muted inline-flex h-9 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
