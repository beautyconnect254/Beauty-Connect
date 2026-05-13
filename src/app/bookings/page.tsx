import { ProtectedLink } from "@/components/auth/protected-link";
import { ProtectedRouteGate } from "@/components/auth/protected-route-gate";
import { BookingsClient } from "@/components/bookings/bookings-client";
import { SiteShell } from "@/components/layout/site-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { buttonVariants } from "@/components/ui/button";
import { getUserBookings } from "@/lib/data-access";
import { getCurrentUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const user = await getCurrentUser();
  const bookings = user ? await getUserBookings(user.id) : [];

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl space-y-4 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
        <PageIntro
          eyebrow="Bookings"
          title="Reservation Pipeline"
          description="Confirmed bookings show assigned workers, compensation terms, and the global platform fee. Workers lock only when deposit payment starts."
          actions={
            <ProtectedLink
              href="/team-builder"
              intentTitle="Sign in to build your team"
              className={buttonVariants({ variant: "default" })}
            >
              Build Team
            </ProtectedLink>
          }
        />

        {user ? (
          <BookingsClient bookings={bookings} />
        ) : (
          <ProtectedRouteGate
            href="/bookings"
            title="Sign in to view bookings"
            description="Bookings are now connected to your account and persist across devices."
          />
        )}
      </div>
    </SiteShell>
  );
}
