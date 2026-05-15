import { SiteShell } from "@/components/layout/site-shell";
import { PageIntro } from "@/components/shared/page-intro";

interface UtilityPageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function UtilityPage({ eyebrow, title, description }: UtilityPageProps) {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-3xl space-y-4 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
        <PageIntro eyebrow={eyebrow} title={title} description={description} />
        <section className="rounded-lg border border-[color:var(--border)] bg-white p-4 text-sm font-semibold leading-6 text-[color:var(--muted-foreground)]">
          This page is ready for your content.
        </section>
      </div>
    </SiteShell>
  );
}
