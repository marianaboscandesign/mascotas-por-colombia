"use client";

import { Facebook, Link2, Check, MessageCircle, Share2, Twitter } from "lucide-react";
import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/** Botones interactivos para compartir en WhatsApp, Facebook, X, nativo y copiar enlace. */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [isShareSupported, setIsShareSupported] = useState(false);

  // Verifica soporte de Web Share API al montar el componente
  useEffect(() => {
    setIsShareSupported(!!navigator.share);
  }, []);

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title,
        text: title,
        url,
      });
    } catch (err) {
      console.warn("[Share] Error compartiendo:", err);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("[Share] No se pudo copiar:", err);
    }
  };

  const text = encodeURIComponent(title);
  const u = encodeURIComponent(url);

  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      icon: MessageCircle,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      icon: Facebook,
    },
    {
      label: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${text}&url=${u}`,
      icon: Twitter,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm font-medium">
        Compartir caso:
      </span>

      {/* Botón de Compartir nativo en Mobile */}
      {isShareSupported && (
        <button
          onClick={handleNativeShare}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 h-8")}
        >
          <Share2 className="size-4" />
          <span className="text-xs">Compartir</span>
        </button>
      )}

      {/* Redes tradicionales */}
      {links.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Compartir en ${label}`}
          className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-8")}
        >
          <Icon className="size-4" aria-hidden="true" />
        </a>
      ))}

      {/* Copiar enlace */}
      <button
        onClick={handleCopy}
        aria-label="Copiar enlace al portapapeles"
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "size-8 transition-colors duration-200",
          copied && "border-green-500 text-green-600 bg-green-50/50 dark:bg-green-950/20 hover:text-green-700"
        )}
      >
        {copied ? (
          <Check className="size-4" />
        ) : (
          <Link2 className="size-4" />
        )}
      </button>
    </div>
  );
}
