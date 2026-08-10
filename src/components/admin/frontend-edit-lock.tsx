"use client";

import * as React from "react";
import { Lock, Unlock, Key, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

const DEFAULT_PASSWORD = "adm4040";

function FrontendEditLockContent() {
  const searchParams = useSearchParams();
  const showLock = searchParams.has("editar");
  
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [passwordInput, setPasswordInput] = React.useState("");
  const [error, setError] = React.useState("");

  const checkAuth = React.useCallback(() => {
    const auth = localStorage.getItem("frontend_edit_authenticated") === "true";
    setIsAuthenticated(auth);
  }, []);

  React.useEffect(() => {
    if (!showLock) return;

    checkAuth();
    window.addEventListener("frontend-edit-auth-change", checkAuth);
    return () => {
      window.removeEventListener("frontend-edit-auth-change", checkAuth);
    };
  }, [showLock, checkAuth]);

  if (!showLock) return null;

  const handleOpenLock = () => {
    if (isAuthenticated) {
      if (confirm("¿Cerrar el modo de edición rápida?")) {
        localStorage.removeItem("frontend_edit_authenticated");
        localStorage.removeItem("frontend_edit_password");
        window.dispatchEvent(new Event("frontend-edit-auth-change"));
      }
    } else {
      setError("");
      setPasswordInput("");
      setModalOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const correctPassword = process.env.NEXT_PUBLIC_EDIT_PASSWORD || DEFAULT_PASSWORD;
    if (passwordInput === correctPassword) {
      localStorage.setItem("frontend_edit_authenticated", "true");
      localStorage.setItem("frontend_edit_password", passwordInput);
      window.dispatchEvent(new Event("frontend-edit-auth-change"));
      setModalOpen(false);
    } else {
      setError("Contraseña incorrecta. Inténtalo de nuevo.");
    }
  };

  return (
    <>
      <button
        onClick={handleOpenLock}
        className={`fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full text-white shadow-xl transition-all hover:scale-105 active:scale-95 ${
          isAuthenticated 
            ? "bg-success hover:bg-success/90 ring-4 ring-success/20 animate-pulse" 
            : "bg-primary hover:bg-primary/90 ring-4 ring-primary/20"
        }`}
        title={isAuthenticated ? "Modo edición activo (Click para desactivar)" : "Activar modo edición rápida"}
      >
        {isAuthenticated ? <Unlock className="size-6" /> : <Lock className="size-6" />}
      </button>

      {modalOpen && (
        <div 
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="border-border bg-card w-full max-w-sm rounded-2xl border p-6 shadow-xl animate-in zoom-in-95"
          >
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
                <Key className="size-5" />
              </span>
              <div>
                <h3 className="font-heading text-lg font-semibold">Edición Rápida</h3>
                <p className="text-muted-foreground text-xs">Ingresa la clave de administración</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="edit-password">Contraseña</label>
                <input
                  id="edit-password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  placeholder="••••••••"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-xs">
                  <AlertCircle className="size-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border-input hover:bg-muted inline-flex h-9 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function FrontendEditLock() {
  return (
    <React.Suspense fallback={null}>
      <FrontendEditLockContent />
    </React.Suspense>
  );
}
