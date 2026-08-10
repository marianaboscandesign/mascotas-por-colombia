"use client";

import * as React from "react";
import { Film, X } from "lucide-react";

import {
  ACCEPTED_VIDEO_TYPES,
  MAX_VIDEO_SECONDS,
  MAX_VIDEO_SIZE_MB,
} from "@/lib/constants/pets";

interface VideoUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

const ACCEPT = ACCEPTED_VIDEO_TYPES.join(",");

/** Lee la duración (segundos) de un archivo de video. */
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer el video"));
    };
    video.src = url;
  });
}

export function VideoUpload({
  value,
  onChange,
  disabled = false,
}: VideoUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [checking, setChecking] = React.useState(false);

  const previewUrl = React.useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value],
  );
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;

    if (!(ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type)) {
      setError("Formato no admitido. Usa MP4, WebM o MOV.");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setError(`El video debe pesar menos de ${MAX_VIDEO_SIZE_MB} MB.`);
      return;
    }

    setChecking(true);
    try {
      const duration = await getVideoDuration(file);
      if (duration > MAX_VIDEO_SECONDS + 0.5) {
        setError(`El video debe durar máximo ${MAX_VIDEO_SECONDS} segundos.`);
        return;
      }
      onChange(file);
    } catch {
      setError("No se pudo procesar el video. Intenta con otro archivo.");
    } finally {
      setChecking(false);
    }
  }

  if (value && previewUrl) {
    return (
      <div className="space-y-2">
        <div className="border-border relative overflow-hidden rounded-xl border bg-black">
          <video
            src={previewUrl}
            controls
            className="aspect-video w-full object-contain"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            aria-label="Quitar video"
            className="bg-foreground/70 text-background absolute top-2 right-2 grid size-8 place-items-center rounded-full transition-opacity hover:opacity-90"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="text-muted-foreground text-xs">{value.name}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled || checking}
        onClick={() => inputRef.current?.click()}
        className="border-input bg-muted/30 hover:border-primary/60 hover:bg-secondary/40 focus-visible:ring-ring flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="bg-secondary text-primary grid size-11 place-items-center rounded-full">
          <Film className="size-5" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium">
          {checking ? "Procesando video…" : "Subir un video corto (opcional)"}
        </span>
        <span className="text-muted-foreground text-xs">
          MP4, WebM o MOV · máx. {MAX_VIDEO_SECONDS} s · {MAX_VIDEO_SIZE_MB} MB
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="text-destructive text-sm font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
