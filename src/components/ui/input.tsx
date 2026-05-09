import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 text-sm text-[color:var(--foreground)] shadow-sm outline-none transition placeholder:text-[color:var(--muted-foreground)] focus:border-[color:var(--ring)] focus:ring-2 focus:ring-[color:var(--ring)]/30",
        className,
      )}
      {...props}
    />
  );
}
