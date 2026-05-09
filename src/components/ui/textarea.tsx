import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-[24px] border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-[color:var(--foreground)] shadow-sm outline-none transition placeholder:text-[color:var(--muted-foreground)] focus:border-[color:var(--ring)] focus:ring-2 focus:ring-[color:var(--ring)]/30",
        className,
      )}
      {...props}
    />
  );
}
