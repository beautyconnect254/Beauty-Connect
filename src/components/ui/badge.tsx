import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
  {
    variants: {
      variant: {
        default: "bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)]",
        outline: "border border-[color:var(--border)] bg-white/70 text-[color:var(--foreground)]",
        verified: "bg-emerald-100 text-emerald-800",
        pending: "bg-amber-100 text-amber-800",
        critical: "bg-rose-100 text-rose-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
