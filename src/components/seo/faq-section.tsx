import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Sección de Preguntas Frecuentes con datos estructurados Schema.org FAQPage
 * (mejora SEO y puede mostrarse como resultado enriquecido en Google).
 * Usa <details> nativo: accesible y sin JS.
 */
export function FaqSection({
  items,
  title = "Preguntas frecuentes",
  className,
}: {
  items: FaqItem[];
  title?: string;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="faq-heading"
      className={cn("mx-auto max-w-3xl", className)}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((i) => ({
              "@type": "Question",
              name: i.question,
              acceptedAnswer: { "@type": "Answer", text: i.answer },
            })),
          }),
        }}
      />
      <h2
        id="faq-heading"
        className="text-2xl font-bold text-balance sm:text-3xl"
      >
        {title}
      </h2>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <details
            key={item.question}
            className="border-border bg-card group rounded-xl border"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-medium select-none">
              {item.question}
              <ChevronDown
                className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="text-muted-foreground px-4 pb-4 leading-relaxed">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
