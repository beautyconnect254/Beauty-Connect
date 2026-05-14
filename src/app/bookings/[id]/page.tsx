import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, CalendarDays, CreditCard, Users } from "lucide-react";

import { ProtectedRouteGate } from "@/components/auth/protected-route-gate";
import { BookingPaymentAction } from "@/components/bookings/booking-payment-action";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/bookings/workflow-badges";
import { SiteShell } from "@/components/layout/site-shell";
import { TrackingLinkCard } from "@/components/shared/tracking-link-card";
import { WorkerCard } from "@/components/workers/worker-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUserBookingById } from "@/lib/data-access";
import {
  bookingRequiresPayment,
  bookingStatusDescription,
  compensationSentence,
  paymentStatusLabel,
} from "@/lib/booking-workflow";
import { getCurrentUser } from "@/lib/user-auth";
import { cn } from "@/lib/utils";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-5xl space-y-4 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
          <ProtectedRouteGate
            href={`/bookings/${id}`}
            title="Sign in to view this booking"
            description="Booking details are private to the account that created the request."
          />
        </div>
      </SiteShell>
    );
  }

  const booking = await getUserBookingById(id, user.id);

  if (!booking) {
    notFound();
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl space-y-4 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
        <Link
          href="/bookings"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-0")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to bookings
        </Link>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-[color:var(--muted-foreground)]">
                  {booking.type === "team" ? "Team booking" : "Single booking"}
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-[color:var(--foreground)]">
                  {booking.title}
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <BookingStatusBadge status={booking.status} />
                <PaymentStatusBadge status={booking.payment_status} />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md bg-[color:var(--muted)] p-3">
                <Users className="h-4 w-4 text-emerald-700" />
                <p className="mt-2 text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
                  Workers
                </p>
                <p className="text-lg font-extrabold">{booking.worker_count}</p>
              </div>
              <div className="rounded-md bg-[color:var(--muted)] p-3">
                <CalendarDays className="h-4 w-4 text-emerald-700" />
                <p className="mt-2 text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
                  Booking date
                </p>
                <p className="text-lg font-extrabold">
                  {format(parseISO(booking.booking_date), "MMM d, yyyy")}
                </p>
              </div>
              <div className="rounded-md bg-[color:var(--muted)] p-3">
                <CreditCard className="h-4 w-4 text-emerald-700" />
                <p className="mt-2 text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
                  Payment
                </p>
                <p className="text-lg font-extrabold">
                  {paymentStatusLabel(booking.payment_status)}
                </p>
              </div>
            </div>

            <p className="rounded-md border border-[color:var(--border)] bg-white p-3 text-sm font-semibold leading-5 text-[color:var(--muted-foreground)]">
              {booking.notes}
            </p>

            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-900">
              {bookingStatusDescription(booking.status)} Worker contact details stay locked
              until payment is verified and the booking moves to Hires.
            </p>
          </CardContent>
        </Card>

        {bookingRequiresPayment(booking) && booking.payment_instructions ? (
          <BookingPaymentAction
            bookingId={booking.id}
            status={booking.status}
            lockExpiresAt={booking.payment_lock_expires_at}
            defaultPhone={booking.request_details?.client?.contact_whatsapp ?? ""}
          />
        ) : null}

        <TrackingLinkCard trackingToken={booking.tracking_token} />

        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-[color:var(--foreground)]">
            Workers Included
          </h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {booking.workers.map((worker) => {
              const assignment = booking.worker_assignments.find(
                (item) => item.worker_id === worker.id,
              );

              return (
                <div key={worker.id} className="space-y-1.5">
                  <WorkerCard compact worker={worker} />
                  {assignment ? (
                    <p className="rounded-md bg-[color:var(--muted)] px-2 py-1 text-[11px] font-extrabold text-[color:var(--foreground)]">
                      {compensationSentence(assignment)}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
