import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";

import { env } from "@/lib/env";
import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { FrontendEditLock } from "@/components/admin/frontend-edit-lock";
import "./globals.css";

// Google Analytics (gtag.js). Solo se carga en producción para no registrar
// el tráfico de desarrollo. El id se puede sobreescribir con NEXT_PUBLIC_GA_ID.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-0GH1HXEGDB";
const analyticsEnabled = process.env.NODE_ENV === "production";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.slogan}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // El canonical NO se define aquí (se heredaría a todas las rutas y todas
  // apuntarían al home). Cada página define el suyo; el resto se autocanoniza.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/android-chrome-192.png", type: "image/png", sizes: "192x192" },
      { url: "/android-chrome-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "mask-icon", url: "/mask-icon.svg", color: siteConfig.themeColor },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  colorScheme: "light dark",
};

// Aplica el tema (claro/oscuro) antes de pintar para evitar parpadeo (FOUC):
// usa la preferencia guardada o, si no hay, la del sistema.
// Por defecto modo CLARO para usuarios nuevos: solo se activa el oscuro si la
// persona lo eligió explícitamente (guardado en localStorage).
const themeInitScript = `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jakarta.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col font-sans">
        {/* Adelanta la conexión al CDN de imágenes (Supabase) para acelerar el
            LCP, y resuelve el DNS de Analytics sin bloquear el render. React
            eleva estos <link> al <head>. */}
        <link rel="preconnect" href={env.supabaseUrl} crossOrigin="" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {analyticsEnabled && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": ["NGO", "Organization"],
                  "@id": `${siteConfig.url}/#organization`,
                  name: siteConfig.name,
                  alternateName: siteConfig.shortName,
                  url: siteConfig.url,
                  logo: `${siteConfig.url}/logo.png`,
                  description: siteConfig.description,
                  sameAs: [siteConfig.social.instagram],
                  areaServed: { "@type": "Country", name: "Colombia" },
                },
                {
                  "@type": "WebSite",
                  "@id": `${siteConfig.url}/#website`,
                  url: siteConfig.url,
                  name: siteConfig.name,
                  description: siteConfig.description,
                  inLanguage: "es-CO",
                  publisher: { "@id": `${siteConfig.url}/#organization` },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: `${siteConfig.url}/buscar?q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
        <a href="#contenido" className="sr-only-focusable">
          Saltar al contenido principal
        </a>
        <Navbar />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <Footer />
        {/* Espaciador para que la barra inferior fija no tape el contenido en móvil. */}
        <div
          aria-hidden
          className="h-[calc(4rem+env(safe-area-inset-bottom))] xl:hidden"
        />
        <MobileTabBar />
        <FrontendEditLock />
      </body>
    </html>
  );
}
