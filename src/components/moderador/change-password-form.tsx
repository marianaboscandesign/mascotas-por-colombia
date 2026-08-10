"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";

import { changeOwnPassword } from "@/app/moderador/cambiar-clave/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await changeOwnPassword({ password, confirm });
    if (!res.success) {
      setError(res.error);
      setSaving(false);
      return;
    }
    // Contraseña lista: entra al panel.
    router.push("/moderador");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Repite la contraseña</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      {error && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? (
          <Loader2 className="animate-spin" />
        ) : (
          <KeyRound className="size-4" />
        )}
        Guardar y entrar
      </Button>
    </form>
  );
}
