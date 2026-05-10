import Link from "next/link";

import { BookingsClient } from "@/components/bookings/bookings-client";
import { SiteShell } from "@/components/layout/site-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { buttonVariants } from "@/components/ui/button";
import { getBookings } from "@/lib/data-access";

export default function BookingsPage() {
  const bookings = getBookings();

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl space-y-4 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
        <PageIntro
          eyebrow="Bookings"
          title="Reservation Pipeline"
          description="Pending bookings are reviewed by Beauty Connect. Confirmed bookings show payment instructions; contacts unlock only in Hires."
          actions={
            <Link href="/team-builder" className={buttonVariants({ variant: "default" })}>
              Build Team
            </Link>
          }
        />

        <BookingsClient bookings={bookings} />
      </div>
    </SiteShell>
  );
}
