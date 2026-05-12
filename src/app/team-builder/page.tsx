import { ProtectedRouteGate } from "@/components/auth/protected-route-gate";
import { SiteShell } from "@/components/layout/site-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { TeamBuilderClient } from "@/components/team-builder/team-builder-client";
import { getRoleSpecialtyCatalogAsync } from "@/lib/data-access";
import { getCurrentUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export default async function TeamBuilderPage() {
  const user = await getCurrentUser();
  const roleCatalog = await getRoleSpecialtyCatalogAsync();

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
        <PageIntro
          eyebrow="Bookings"
          title="Build Your Salon Team"
          description="Share salon details, choose roles, and send the request for review."
        />

        {user ? (
          <TeamBuilderClient roleCatalog={roleCatalog} />
        ) : (
          <ProtectedRouteGate
            href="/team-builder"
            title="Sign in to build your team"
            description="Team requests are saved to your Beauty Connect account so you can track them later."
          />
        )}
      </div>
    </SiteShell>
  );
}
