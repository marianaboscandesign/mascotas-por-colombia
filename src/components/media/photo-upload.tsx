"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";

import {
  ACCEPTED_IMAGE_TYPES,
  MAX_PHOTO_SIZE_MB,
  MAX_PHOTOS,
} from "@/lib/constants/pets";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
  invalid?: boolean;
}

const ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

export function PhotoUpload({
  value,
  onChange,
  maxPhotos = MAX_PHOTOS,
  disabled = false,
  invalid = false,
}: PhotoUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [warning, setWarning] = React.useState<string | null>(null);

  // Previsualizaciones (object URLs) sincronizadas con los archivos.
  const previews = React.useMemo(
    () => value.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [value],
  );
  React.useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  const addFiles = React.useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      setWarning(null);
      const accepted: File[] = [];
      const maxBytes = MAX_PHOTO_SIZE_MB * 1024 * 1024;

      for (const file of Array.from(incoming)) {
        if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
          setWarning("Solo se aceptan imágenes JPG, PNG o WebP.");
          continue;
        }
        if (file.size > maxBytes) {
          setWarning(`Cada foto debe pesar menos de ${MAX_PHOTO_SIZE_MB} MB.`);
          continue;
        }
        accepted.push(file);
      }

      const next = [...value, ...accepted].slice(0, maxPhotos);
      if (value.length + accepted.length > maxPhotos) {
        setWarning(`Puedes subir un máximo de ${maxPhotos} fotos.`);
      }
      onChange(next);
    },
    [value, onChange, maxPhotos],
  );

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const canAddMore = value.length < maxPhotos;

  return (
    <div className="space-y-3">
      {canAddMore && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "border-input bg-muted/30 hover:border-primary/60 hover:bg-secondary/40 focus-visible:ring-ring flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            dragging && "border-primary bg-secondary/60",
            invalid && "border-destructive",
          )}
        >
          <span className="bg-secondary text-primary grid size-11 place-items-center rounded-full">
            <ImagePlus className="size-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium">
            Arrastra fotos aquí o haz clic para seleccionarlas
          </span>
          <span className="text-muted-foreground text-xs">
            JPG, PNG o WebP · hasta {maxPhotos} fotos · máx. {MAX_PHOTO_SIZE_MB}{" "}
            MB c/u
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {warning && (
        <p className="text-warning text-sm" role="alert">
          {warning}
        </p>
      )}

      {previews.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {previews.map((preview, index) => (
            <li
              key={preview.url}
              className="group border-border bg-muted relative aspect-square overflow-hidden rounded-lg border"
            >
              <Image
                src={preview.url}
                alt={`Foto ${index + 1}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 33vw, 25vw"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={disabled}
                aria-label={`Quitar foto ${index + 1}`}
                className="bg-foreground/70 text-background absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
