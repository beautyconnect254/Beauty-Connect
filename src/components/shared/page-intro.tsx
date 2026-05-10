import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageIntroProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase text-[color:var(--muted-foreground)]">
          {eyebrow}
        </p>
        <h1 className="max-w-3xl text-2xl font-extrabold leading-tight text-[color:var(--foreground)] sm:text-3xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[color:var(--muted-foreground)]">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}
