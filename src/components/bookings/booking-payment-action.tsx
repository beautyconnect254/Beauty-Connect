"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Clock3, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BookingStatus } from "@/lib/types";

interface BookingPaymentActionProps {
  bookingId?: string;
  trackingToken?: string;
  status: BookingStatus;
  lockExpiresAt?: string | null;
  defaultPhone?: string;
}

async function readError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
    message?: string;
  } | null;

  return body?.error || body?.message || "Could not start deposit payment.";
}

function formatLockExpiry(value?: string | null) {
  if (!value) {
    return "";
  }

  try {
    return format(parseISO(value), "HH:mm");
  } catch {
    return "";
  }
}

export function BookingPaymentAction({
  bookingId,
  trackingToken,
  status,
  lockExpiresAt,
  defaultPhone = "",
}: BookingPaymentActionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);

  async function startPayment() {
    setLoading(true);
    setNotice("");

    try {
      const response = await fetch("/api/payments/stkpush", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          trackingToken,
          phoneNumber,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setNotice("STK Push sent. Check your phone to complete the deposit.");
      router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not start deposit payment.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (status === "payment_pending") {
    const expires = formatLockExpiry(lockExpiresAt);

    return (
      <div className="rounded-md border border-purple-200 bg-purple-50 p-3 text-sm font-semibold text-purple-900">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          <span>
            Payment in progress{expires ? ` until ${expires}` : ""}. Check your
            phone for the M-Pesa prompt.
          </span>
        </div>
      </div>
    );
  }

  if (status !== "confirmed") {
    return null;
  }

  return (
    <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,240px)_auto]">
        <Input
          inputMode="tel"
          placeholder="07XX XXX XXX"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
        />
        <Button
          className="w-full sm:w-auto"
          disabled={loading || !phoneNumber.trim()}
          onClick={startPayment}
        >
          <CreditCard className="h-4 w-4" />
          {loading ? "Sending STK..." : "Pay Deposit"}
        </Button>
      </div>
      {notice ? (
        <p className="text-xs font-bold leading-5 text-emerald-950">{notice}</p>
      ) : (
        <p className="text-xs font-semibold leading-5 text-emerald-900">
          Rechecks worker availability, locks the assignment for 3 minutes, then
          sends an M-Pesa prompt.
        </p>
      )}
    </div>
  );
}
