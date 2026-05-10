import { SiteShell } from "@/components/layout/site-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { TeamBuilderClient } from "@/components/team-builder/team-builder-client";
import { getRoleSpecialtyCatalog } from "@/lib/data-access";

export default function TeamBuilderPage() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
        <PageIntro
          eyebrow="Bookings"
          title="Build Your Salon Team"
          description="Share salon details, choose roles, and send the request for review."
        />

        <TeamBuilderClient roleCatalog={getRoleSpecialtyCatalog()} />
      </div>
    </SiteShell>
  );
}
