import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full appearance-none rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 text-sm text-[color:var(--foreground)] shadow-sm outline-none transition focus:border-[color:var(--ring)] focus:ring-2 focus:ring-[color:var(--ring)]/30",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
