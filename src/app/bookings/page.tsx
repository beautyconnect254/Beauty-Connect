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
          title="Worker And Team Bookings"
          description="Pending requests are checked by Beauty Connect. Confirmed bookings are ready for deposit payment."
          actions={
            <>
              <Link href="/team-builder" className={buttonVariants({ variant: "default" })}>
                Build Team
              </Link>
              <Link href="/workers" className={buttonVariants({ variant: "outline" })}>
                Single Booking
              </Link>
            </>
          }
        />

        <BookingsClient bookings={bookings} />
      </div>
    </SiteShell>
  );
}
