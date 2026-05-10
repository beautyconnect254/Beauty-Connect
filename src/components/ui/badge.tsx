import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
  {
    variants: {
      variant: {
        default: "bg-purple-100 text-purple-800",
        outline: "border border-[color:var(--border)] bg-white text-[color:var(--foreground)]",
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
