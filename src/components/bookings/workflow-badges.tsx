import { Badge } from "@/components/ui/badge";
import type { BookingStatus, PaymentStatus } from "@/lib/types";
import {
  bookingStatusClass,
  bookingStatusLabel,
  paymentStatusClass,
  paymentStatusLabel,
} from "@/lib/booking-workflow";
import { cn } from "@/lib/utils";

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge className={cn("normal-case", bookingStatusClass(status))}>
      {bookingStatusLabel(status)}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge className={cn("normal-case", paymentStatusClass(status))}>
      {paymentStatusLabel(status)}
    </Badge>
  );
}
