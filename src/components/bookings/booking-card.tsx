import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CalendarDays, ClipboardList, CreditCard, Users } from "lucide-react";

import { BookingStatusBadge } from "@/components/bookings/workflow-badges";
import { Card, CardContent } from "@/components/ui/card";
import type { Booking } from "@/lib/types";
import {
  bookingStatusDescription,
  compensationSentence,
  paymentStatusClass,
  paymentStatusLabel,
} from "@/lib/booking-workflow";
import { cn, formatCurrency } from "@/lib/utils";

interface BookingCardProps {
  booking: Booking;
  href?: string;
  interactive?: boolean;
}

export function BookingCard({
  booking,
  href,
  interactive = true,
}: BookingCardProps) {
  const workerNames = booking.workers.map((worker) => worker.full_name).join(", ");
  const primaryAssignment = booking.worker_assignments[0];

  const content = (
      <Card className="transition hover:border-emerald-400 hover:shadow-md">
        <CardContent className="space-y-3 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[color:var(--foreground)]">
                {booking.title}
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-[color:var(--muted-foreground)]">
                {workerNames || "No workers assigned yet"}
              </p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-bold text-[color:var(--muted-foreground)]">
            <span className="flex min-w-0 items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <span className="truncate">{booking.worker_count} workers</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <span className="truncate">
                {format(parseISO(booking.booking_date), "MMM d")}
              </span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <span className="truncate">{paymentStatusLabel(booking.payment_status)}</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1 rounded-full bg-[color:var(--muted)] px-2 py-0.5 text-[10px] font-bold uppercase text-[color:var(--muted-foreground)]">
              <ClipboardList className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {booking.type === "team" ? "Team booking" : "Single booking"}
              </span>
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", paymentStatusClass(booking.payment_status))}>
              {paymentStatusLabel(booking.payment_status)}
            </span>
          </div>

          {booking.payment_instructions || primaryAssignment ? (
            <div className="grid gap-1.5 rounded-md bg-[color:var(--muted)] px-2 py-1.5 text-[11px] font-bold text-[color:var(--foreground)]">
              {primaryAssignment ? (
                <span className="truncate">
                  {compensationSentence(primaryAssignment)}
                </span>
              ) : null}
              {booking.payment_instructions ? (
                <span className="truncate text-[color:var(--muted-foreground)]">
                  Platform fee:{" "}
                  {formatCurrency(booking.payment_instructions.deposit_amount)}
                </span>
              ) : null}
            </div>
          ) : null}

          <p className="line-clamp-2 text-xs font-semibold leading-5 text-[color:var(--muted-foreground)]">
            {bookingStatusDescription(booking.status)}
          </p>
        </CardContent>
      </Card>
  );

  if (!interactive) {
    return content;
  }

  return (
    <Link href={href ?? `/bookings/${booking.id}`} className="block">
      {content}
    </Link>
  );
}
