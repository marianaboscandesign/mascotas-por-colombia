import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "focus-visible:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border-transparent",
        warm: "bg-warm-soft text-warm-soft-foreground border-transparent",
        secondary: "bg-secondary text-secondary-foreground border-transparent",
        success: "bg-success/12 text-success border-transparent",
        warning: "bg-warning/15 text-warning border-transparent",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
