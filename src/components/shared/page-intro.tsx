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
    <section className={cn("space-y-6", className)}>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--muted-foreground)]">
          {eyebrow}
        </p>
        <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-tight tracking-tight text-[color:var(--foreground)] sm:text-5xl">
          {title}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-[color:var(--muted-foreground)] sm:text-lg">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}
