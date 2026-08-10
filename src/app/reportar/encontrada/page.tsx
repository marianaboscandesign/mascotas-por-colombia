import { permanentRedirect } from "next/navigation";

import { routes } from "@/config/navigation";

/** La ruta del módulo de encontradas se movió a /found-pets/reportar. */
export default function ReportarEncontradaRedirect() {
  permanentRedirect(routes.reportFound);
}
