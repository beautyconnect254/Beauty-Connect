import { HireCard } from "@/components/hires/hire-card";
import { SiteShell } from "@/components/layout/site-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { getHires } from "@/lib/data-access";

export default function HiresPage() {
  const hires = getHires();

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl space-y-4 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
        <PageIntro
          eyebrow="Hires"
          title="Paid Active Hires"
          description="Paid worker and team hires with contact actions unlocked."
        />

        {hires.length > 0 ? (
          <div className="grid gap-2.5 lg:grid-cols-2">
            {hires.map((hire) => (
              <HireCard hire={hire} key={hire.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[color:var(--border)] bg-white p-4 text-sm font-semibold text-[color:var(--muted-foreground)]">
            No paid hires yet.
          </div>
        )}
      </div>
    </SiteShell>
  );
}
