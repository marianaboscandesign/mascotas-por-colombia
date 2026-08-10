import {
  Bandage,
  Bone,
  Box,
  BedDouble,
  BedSingle,
  Cat,
  Cross,
  Dog,
  Droplets,
  Hand,
  HandCoins,
  House,
  Link2,
  PawPrint,
  Pill,
  ShoppingBag,
  SprayCan,
  Stethoscope,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { SHELTER_NEED_LABELS } from "@/lib/constants/shelters";
import { cn } from "@/lib/utils";
import { type ShelterNeedEnum } from "@/types/database";

const NEED_ICON: Record<ShelterNeedEnum, LucideIcon> = {
  alimento: Bone,
  perrarina: Dog,
  gatarina: Cat,
  agua: Droplets,
  medicinas: Pill,
  guantes: Hand,
  gasas: Cross,
  vendas: Bandage,
  mantas: BedDouble,
  correas: Link2,
  kennels: Box,
  casas_temporales: House,
  camas: BedSingle,
  accesorios: ShoppingBag,
  arena_gatos: PawPrint,
  productos_limpieza: SprayCan,
  transporte: Truck,
  veterinarios: Stethoscope,
  donaciones: HandCoins,
};

export function NeedsBadges({
  needs,
  className,
}: {
  needs: ShelterNeedEnum[];
  className?: string;
}) {
  if (needs.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {needs.map((need) => {
        const Icon = NEED_ICON[need];
        return (
          <li
            key={need}
            className="bg-warm-soft text-warm-soft-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {SHELTER_NEED_LABELS[need]}
          </li>
        );
      })}
    </ul>
  );
}
