import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/admin";
import { getExternalPetReviews } from "@/lib/data/external-pet-imports";
import { Container } from "@/components/ui/container";
import { ExternalImportRow } from "@/components/admin/external-import-row";

export const metadata: Metadata = { title: "Importaciones · Panel", robots: { index: false, follow: false } };

export default async function ExternalImportsPage() {
  await requireAdmin();
  const reports = await getExternalPetReviews();
  return (
    <Container className="py-10">
      <div className="mb-6"><h1 className="text-2xl font-bold sm:text-3xl">Revisión de importaciones</h1><p className="text-muted-foreground mt-1 text-sm">Solo aparecen avisos externos con posibles duplicados. Los que no coinciden se publican automáticamente.</p></div>
      {reports.length === 0 ? <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border p-6 text-center text-sm">No hay posibles duplicados pendientes.</p> : <ul className="space-y-5">{reports.map((report) => <ExternalImportRow key={report.id} report={report} />)}</ul>}
    </Container>
  );
}
