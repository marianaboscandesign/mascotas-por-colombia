import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Servir imágenes directo desde el origen (Supabase Storage/CDN) sin el
    // optimizador de Vercel: en el plan gratuito la cuota de optimización se
    // agota con 1000+ fotos y devuelve 402 (imágenes rotas). Las fotos ya se
    // comprimen al subirlas, así que se sirven tal cual.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Supabase Storage public bucket. Replace <project-ref> via env at build time
      // or add your project ref host here once known.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "media.huellascan.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return [
      // La sección de héroes se movió a una URL SEO-friendly.
      { source: "/heroes", destination: "/heroes-caninos", permanent: true },
    ];
  },
};

export default nextConfig;
