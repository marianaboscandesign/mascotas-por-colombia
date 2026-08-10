"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Pencil,
  UserPlus,
  X,
} from "lucide-react";

import {
  createModerator,
  setModeratorActive,
  updateModerator,
} from "@/app/admin/moderadores/actions";
import { type ModeratorAccount } from "@/lib/data/moderators";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function ModeratorManager({
  moderators,
}: {
  moderators: ModeratorAccount[];
}) {
  const router = useRouter();
  const [v, setV] = React.useState({ fullName: "", email: "", password: "" });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  // Edición en línea de un moderador.
  const [editId, setEditId] = React.useState<string | null>(null);
  const [edit, setEdit] = React.useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [editSaving, setEditSaving] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setSaving(true);
    const res = await createModerator(v);
    if (!res.success) {
      setError(res.error);
      setSaving(false);
      return;
    }
    setOk(`Moderador ${v.fullName} creado.`);
    setV({ fullName: "", email: "", password: "" });
    setSaving(false);
    router.refresh();
  }

  async function toggle(m: ModeratorAccount) {
    setPendingId(m.id);
    await setModeratorActive(m.id, !m.is_active);
    setPendingId(null);
    router.refresh();
  }

  function startEdit(m: ModeratorAccount) {
    setEditError(null);
    setOk(null);
    setEditId(m.id);
    setEdit({ fullName: m.full_name, email: m.email, password: "" });
  }

  async function onUpdate(e: React.FormEvent, m: ModeratorAccount) {
    e.preventDefault();
    setEditError(null);
    setEditSaving(true);
    const payload: {
      id: string;
      fullName?: string;
      email?: string;
      password?: string;
    } = { id: m.id };
    if (edit.fullName.trim() && edit.fullName.trim() !== m.full_name)
      payload.fullName = edit.fullName.trim();
    if (edit.email.trim() && edit.email.trim() !== m.email)
      payload.email = edit.email.trim();
    if (edit.password) payload.password = edit.password;

    const res = await updateModerator(payload);
    setEditSaving(false);
    if (!res.success) {
      setEditError(res.error);
      return;
    }
    setOk(
      `Cuenta de ${edit.fullName || m.full_name} actualizada${
        edit.password ? ". Nueva contraseña lista para compartir." : "."
      }`,
    );
    setEditId(null);
    router.refresh();
  }

  return (
    <div className="space-y-10">
      {/* Crear */}
      <section className="border-border bg-card max-w-2xl rounded-2xl border p-6 shadow-sm">
        <h2 className="font-heading flex items-center gap-2 text-lg font-semibold">
          <UserPlus className="text-primary size-5" aria-hidden="true" />
          Crear moderador
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Se crea la cuenta con acceso solo al panel de moderación. Comparte el
          correo y la contraseña con la persona; deberá cambiarla al entrar por
          primera vez.
        </p>
        <form onSubmit={onCreate} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nombre completo</Label>
              <Input
                value={v.fullName}
                onChange={(e) => setV({ ...v, fullName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                value={v.email}
                onChange={(e) => setV({ ...v, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Contraseña temporal (mín. 8 caracteres)</Label>
            <Input
              type="text"
              value={v.password}
              onChange={(e) => setV({ ...v, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {ok && (
            <div className="border-success/30 bg-success/5 text-success flex items-start gap-2 rounded-lg border p-3 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <p>{ok}</p>
            </div>
          )}

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Crear moderador
          </Button>
        </form>
      </section>

      {/* Lista */}
      <section>
        <h2 className="font-heading text-lg font-semibold">
          Moderadores ({moderators.length})
        </h2>
        {moderators.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 mt-4 rounded-xl border p-6 text-center text-sm">
            Aún no hay moderadores.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {moderators.map((m) => (
              <li
                key={m.id}
                className="border-border bg-card rounded-xl border p-4 shadow-sm"
              >
                {editId === m.id ? (
                  /* --- Modo edición --- */
                  <form onSubmit={(e) => onUpdate(e, m)} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading flex items-center gap-2 font-semibold">
                        <Pencil className="text-primary size-4" />
                        Editar {m.full_name}
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditId(null)}
                      >
                        <X className="size-4" />
                        Cancelar
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Nombre completo</Label>
                        <Input
                          value={edit.fullName}
                          onChange={(e) =>
                            setEdit({ ...edit, fullName: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Correo electrónico</Label>
                        <Input
                          type="email"
                          value={edit.email}
                          onChange={(e) =>
                            setEdit({ ...edit, email: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5">
                        <KeyRound className="size-3.5" />
                        Nueva contraseña
                      </Label>
                      <Input
                        type="text"
                        value={edit.password}
                        placeholder="Déjala vacía para no cambiarla"
                        onChange={(e) =>
                          setEdit({ ...edit, password: e.target.value })
                        }
                      />
                      <p className="text-muted-foreground text-xs">
                        No se puede ver la contraseña actual (está cifrada).
                        Escribe una nueva para restablecerla y compártela con la
                        persona; la cambiará al entrar.
                      </p>
                    </div>

                    {editError && (
                      <div className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <p>{editError}</p>
                      </div>
                    )}

                    <Button type="submit" disabled={editSaving} size="sm">
                      {editSaving && <Loader2 className="animate-spin" />}
                      Guardar cambios
                    </Button>
                  </form>
                ) : (
                  /* --- Vista normal --- */
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-semibold">
                          {m.full_name}
                        </h3>
                        {m.is_active ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="warning">Inactivo</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">{m.email}</p>
                      <p className="text-muted-foreground text-xs">
                        Desde {formatDate(m.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(m)}
                      >
                        <Pencil className="size-4" />
                        Editar
                      </Button>
                      <Button
                        variant={m.is_active ? "ghost" : "default"}
                        size="sm"
                        onClick={() => toggle(m)}
                        disabled={pendingId === m.id}
                      >
                        {pendingId === m.id && (
                          <Loader2 className="animate-spin" />
                        )}
                        {m.is_active ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
