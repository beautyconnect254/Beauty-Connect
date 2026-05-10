import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CalendarDays, CreditCard, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Booking, BookingStatus, PaymentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BookingCardProps {
  booking: Booking;
}

export function bookingStatusLabel(status: BookingStatus) {
  return status === "confirmed" ? "Confirmed" : "Pending";
}

export function paymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "deposit_due":
      return "Deposit due";
    case "deposit_paid":
      return "Deposit paid";
    case "paid":
      return "Paid";
    default:
      return "Not due";
  }
}

function statusClass(status: BookingStatus) {
  return status === "confirmed"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-purple-100 text-purple-800";
}

function paymentClass(status: PaymentStatus) {
  return status === "deposit_due"
    ? "bg-amber-100 text-amber-800"
    : "bg-slate-100 text-slate-700";
}

export function BookingCard({ booking }: BookingCardProps) {
  const workerNames = booking.workers.map((worker) => worker.full_name).join(", ");

  return (
    <Link href={`/bookings/${booking.id}`} className="block">
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
            <Badge className={cn("shrink-0 normal-case", statusClass(booking.status))}>
              {bookingStatusLabel(booking.status)}
            </Badge>
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
            <span className="rounded-full bg-[color:var(--muted)] px-2 py-0.5 text-[10px] font-bold uppercase text-[color:var(--muted-foreground)]">
              {booking.type === "team" ? "Team booking" : "Single booking"}
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", paymentClass(booking.payment_status))}>
              {paymentStatusLabel(booking.payment_status)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
