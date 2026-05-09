import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--primary)] px-5 py-3 text-[color:var(--primary-foreground)] shadow-[0_18px_40px_-20px_rgba(112,78,48,0.55)] hover:-translate-y-0.5 hover:brightness-105",
        secondary:
          "bg-[color:var(--secondary)] px-5 py-3 text-[color:var(--secondary-foreground)] hover:bg-[#eadfcb]",
        outline:
          "border border-[color:var(--border)] bg-white/70 px-5 py-3 text-[color:var(--foreground)] hover:bg-white",
        ghost:
          "px-4 py-2 text-[color:var(--foreground)] hover:bg-white/70",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      type={type}
      {...props}
    />
  );
}
