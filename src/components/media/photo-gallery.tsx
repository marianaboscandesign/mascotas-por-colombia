"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, HeartHandshake, ZoomIn } from "lucide-react";
import { petPhotoUrl } from "@/lib/storage/pet-photos";

interface PhotoGalleryProps {
  photos: string[];
  alt: string;
  variant?: "default" | "success";
}

export function PhotoGallery({ photos, alt, variant = "default" }: PhotoGalleryProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const handleOpen = React.useCallback((index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  }, []);

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const handlePrev = React.useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const handleNext = React.useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  // Keyboard navigation and body scroll lock
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    
    // Prevent scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleClose, handlePrev, handleNext]);

  // Render early returns AFTER hooks are registered to satisfy react-hooks/rules-of-hooks
  if (photos.length === 0) {
    if (variant === "success") {
      return (
        <div className="from-success/20 to-background grid aspect-[4/3] place-items-center rounded-2xl bg-gradient-to-br">
          <HeartHandshake className="text-success size-12" aria-hidden="true" />
        </div>
      );
    }
    return (
      <div className="border-border bg-muted text-muted-foreground grid aspect-[4/3] place-items-center rounded-2xl border">
        Sin fotografías
      </div>
    );
  }

  const main = photos[0];
  const rest = photos.slice(1);

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div 
        onClick={() => handleOpen(0)}
        className="border-border bg-muted relative aspect-[4/3] overflow-hidden rounded-2xl border cursor-pointer group"
      >
        <Image
          src={petPhotoUrl(main!)}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain transition-transform duration-300 group-hover:scale-[1.01]"
        />
        {/* Mobile indicator (bottom-right) */}
        <div className="absolute bottom-3 right-3 md:hidden bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-full shadow-md z-10 pointer-events-none">
          <ZoomIn className="size-4" />
        </div>
        {/* Desktop overlay on hover: centered in X and Y */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex items-center justify-center pointer-events-none">
          <span className="bg-black/60 text-white text-xs px-3.5 py-2 rounded-full font-medium backdrop-blur-sm shadow-md flex items-center gap-1.5">
            <ZoomIn className="size-4" />
            Ver ampliada
          </span>
        </div>
      </div>

      {/* Thumbnails */}
      {rest.length > 0 && (
        <ul className="grid grid-cols-4 gap-3">
          {rest.map((path, i) => (
            <li
              key={path}
              onClick={() => handleOpen(i + 1)}
              className="border-border bg-muted relative aspect-square overflow-hidden rounded-lg border cursor-pointer group"
            >
              <Image
                src={petPhotoUrl(path)}
                alt={`${alt} — foto ${i + 2}`}
                fill
                sizes="25vw"
                className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </li>
          ))}
        </ul>
      )}

      {/* Modal Lightbox */}
      {isOpen && (
        <div 
          onClick={handleClose}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/90 p-4 md:p-6 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
        >
          {/* Top navigation header */}
          <div className="flex w-full items-center justify-between text-white z-10">
            <span className="text-sm font-medium opacity-80">
              {currentIndex + 1} / {photos.length}
            </span>
            <button
              onClick={handleClose}
              className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="size-6" />
            </button>
          </div>

          {/* Core Image Area */}
          <div className="relative flex flex-1 w-full max-w-5xl items-center justify-center my-4">
            {photos.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 md:left-4 z-10 rounded-full bg-black/50 hover:bg-black/75 border border-white/10 p-3 text-white transition-all hover:scale-105"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="size-6 md:size-8" />
              </button>
            )}

            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center"
            >
              <Image
                src={petPhotoUrl(photos[currentIndex]!)}
                alt={`${alt} — ampliada ${currentIndex + 1}`}
                fill
                priority
                sizes="100vw"
                className="object-contain select-none"
              />
            </div>

            {photos.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2 md:right-4 z-10 rounded-full bg-black/50 hover:bg-black/75 border border-white/10 p-3 text-white transition-all hover:scale-105"
                aria-label="Siguiente imagen"
              >
                <ChevronRight className="size-6 md:size-8" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails navigation bar */}
          {photos.length > 1 && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-black/30 backdrop-blur-sm rounded-xl p-2 border border-white/10 z-10"
            >
              <ul className="flex justify-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {photos.map((path, idx) => (
                  <li
                    key={path}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative w-12 h-12 rounded-md overflow-hidden cursor-pointer border-2 transition-all shrink-0 ${
                      currentIndex === idx ? "border-primary scale-105 shadow-md shadow-primary/20" : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={petPhotoUrl(path)}
                      alt={`${alt} miniatura ${idx + 1}`}
                      fill
                      sizes="48px"
                      className="object-contain bg-white/5"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
