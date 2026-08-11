import { useState, useCallback, useEffect } from "react";
import { Sparkles, Loader2, Upload, AlertCircle, CheckCircle2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AiAutofillModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "lost-pet" | "found-pet" | "shelter" | "volunteer" | "free-vet";
  onDataExtracted: (data: Record<string, unknown>, images?: File[]) => void;
}

// Convierte una URI de datos Base64 en un objeto de tipo File para poder simular la subida
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const header = arr[0] || "";
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch && mimeMatch[1] ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1] || "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export function AiAutofillModal({
  isOpen,
  onOpenChange,
  entityType,
  onDataExtracted,
}: AiAutofillModalProps) {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSuccess(false);
    }
    onOpenChange(open);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent | ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (typeof e.target?.result === "string") {
              setImagePreview(e.target.result);
            }
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          return;
        }
      }
    }
  }, []);

  // El foco inicial del diálogo no siempre cae en el textarea. Escuchar en el
  // documento permite pegar una captura con Ctrl+V desde cualquier parte del modal.
  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [isOpen, handlePaste]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") {
          setImagePreview(ev.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!text.trim() && !imagePreview) {
      setError("Debes pegar un texto o una imagen para analizar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/extract-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          text: text.trim() || undefined,
          image: imagePreview || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (res.status === 429 || json.error === "RATE_LIMIT") {
          throw new Error("RATE_LIMIT");
        }
        throw new Error(json.error || "Ocurrió un error al procesar.");
      }

      const extractedFiles: File[] = [];

      // 1. Si el usuario subió una captura en el modal, la convertimos a File
      if (imagePreview) {
        try {
          const file = dataURLtoFile(imagePreview, "captura-ia.jpg");
          extractedFiles.push(file);
        } catch (e) {
          console.error("Error al convertir la captura de pantalla a File:", e);
        }
      }

      // 2. Si el backend nos devolvió imágenes descargadas (ej: desde Twitter)
      if (json.images && Array.isArray(json.images)) {
        json.images.forEach((imgBase64: string, index: number) => {
          try {
            const file = dataURLtoFile(imgBase64, `foto-enlace-${index + 1}.jpg`);
            // Evitamos duplicar si es exactamente el mismo preview
            if (imgBase64 !== imagePreview) {
              extractedFiles.push(file);
            }
          } catch (e) {
            console.error("Error al convertir imagen de enlace a File:", e);
          }
        });
      }

      onDataExtracted(json.data, extractedFiles);
      setSuccess(true);
      
      // Cleanup
      setText("");
      setImagePreview(null);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const ENTITY_LABELS: Record<string, string> = {
    "lost-pet": "Mascota Perdida",
    "found-pet": "Mascota Encontrada",
    "shelter": "Refugio",
    "volunteer": "Voluntario",
    "free-vet": "Veterinario",
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[400px] text-center p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-bold">¡Formulario completado!</DialogTitle>
            <DialogDescription className="text-base text-center text-muted-foreground mt-2">
              La IA ha extraído la información de la imagen/texto y ha llenado los campos por ti.
              <br /><br />
              <strong className="text-foreground">Por favor, revisa cada campo</strong> para confirmar que la información sea correcta antes de publicarlo.
            </DialogDescription>
            <Button 
              className="mt-6 w-full text-base py-6"
              size="lg"
              onClick={() => {
                handleOpenChange(false);
                setTimeout(() => {
                  const formElement = document.querySelector("form");
                  if (formElement) {
                    const rect = formElement.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    window.scrollTo({
                      top: rect.top + scrollTop - 120,
                      behavior: "smooth"
                    });
                  }
                }, 100);
              }}
            >
              Revisar formulario
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-amber-500" />
            Autocompletar {ENTITY_LABELS[entityType]}
          </DialogTitle>
          <DialogDescription>
            Pega el texto o sube una captura de pantalla del anuncio (ej. Instagram o X). La IA extraerá los datos automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div 
            className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 transition-colors hover:border-primary/50 relative overflow-hidden group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onPaste={handlePaste}
            tabIndex={0}
          >
            {imagePreview ? (
              <div className="w-full relative rounded-lg overflow-hidden flex justify-center items-center h-48 bg-black/5">
                <img src={imagePreview} alt="Preview" className="max-h-full object-contain" />
                <button 
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground px-2 py-1 rounded-md text-xs font-semibold hover:bg-destructive shadow-sm"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-2 w-full h-full text-muted-foreground">
                <Upload className="size-8 text-primary/50 group-hover:text-primary transition-colors" />
                <div className="text-sm">
                  <span className="font-semibold text-primary">Haz clic para subir una captura</span> o arrastra una imagen. También puedes pegarla con Ctrl+V.
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (typeof ev.target?.result === "string") {
                          setImagePreview(ev.target.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
          </div>

          <div className="relative">
            <Textarea
              placeholder="...O si prefieres, pega un enlace de X (Twitter) o el texto de la publicación aquí."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px] resize-y"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-4 rounded-lg">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              {error === "RATE_LIMIT" ? (
                <div className="flex flex-col gap-1 text-destructive/90">
                  <strong className="text-destructive font-semibold">Servicio muy solicitado</strong>
                  <p>El servicio está temporalmente ocupado. Por favor, intenta de nuevo en unos minutos o completa el formulario de forma manual.</p>
                </div>
              ) : (
                <span className="mt-0.5">{error}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleProcess} 
            disabled={loading || (!text.trim() && !imagePreview)}
            className="bg-gradient-to-r from-amber-500 to-primary hover:from-amber-600 hover:to-primary/90 text-white shadow-md border-0"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Analizando con IA...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" />
                Procesar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
