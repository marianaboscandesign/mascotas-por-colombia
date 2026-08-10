"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = React.createContext<ToastContextValue>({
  toast: () => {},
});

/** Hook para mostrar mensajes tipo toast. */
export function useToast(): ToastContextValue {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const remove = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => remove(id), 3800);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:right-4 sm:left-auto sm:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom",
              t.variant === "success"
                ? "border-success/30 bg-success/10 text-success-foreground"
                : "border-destructive/30 bg-destructive/10 text-destructive-foreground",
            )}
            data-state="open"
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full",
                t.variant === "success"
                  ? "bg-success/20 text-success"
                  : "bg-destructive/20 text-destructive",
              )}
            >
              {t.variant === "success" ? (
                <CheckCircle2 className="size-4" aria-hidden="true" />
              ) : (
                <AlertCircle className="size-4" aria-hidden="true" />
              )}
            </span>
            <p className="text-foreground flex-1 font-medium">{t.message}</p>
            <button
              type="button"
              onClick={() => remove(t.id)}
              aria-label="Cerrar"
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
