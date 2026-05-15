import { SiteShell } from "@/components/layout/site-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { cn } from "@/lib/utils";

import type { ReactNode } from "react";

interface UtilityPageProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function UtilityPage({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: UtilityPageProps) {
  return (
    <SiteShell>
      <div
        className={cn(
          "mx-auto w-full max-w-5xl space-y-5 px-3 py-5 sm:px-6 lg:px-8 lg:py-8",
          className,
        )}
      >
        <PageIntro
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={actions}
        />
        {children ?? (
          <section className="rounded-lg border border-[color:var(--border)] bg-white p-4 text-sm font-semibold leading-6 text-[color:var(--muted-foreground)]">
            This page is ready for your content.
          </section>
        )}
      </div>
    </SiteShell>
  );
}
