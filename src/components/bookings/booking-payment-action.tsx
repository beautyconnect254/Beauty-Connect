"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const paymentIsPending = status === "payment_pending";

  useEffect(() => {
    if (!paymentIsPending) {
      return;
    }

    router.refresh();
    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 4000);
    const expiresAt = lockExpiresAt ? new Date(lockExpiresAt).getTime() : 0;
    const refreshAfterExpiryMs = expiresAt - Date.now() + 1000;
    const timeoutId =
      refreshAfterExpiryMs > 0
        ? window.setTimeout(() => {
            router.refresh();
          }, refreshAfterExpiryMs)
        : null;

    return () => {
      window.clearInterval(intervalId);

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [lockExpiresAt, paymentIsPending, router]);

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

  if (paymentIsPending) {
    const expires = formatLockExpiry(lockExpiresAt);

    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-950">
        <div className="flex items-start gap-2">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>Waiting for M-Pesa confirmation.</p>
            <p className="mt-1 text-xs leading-5 text-amber-900">
              Workers stay reserved while Daraja confirms payment
              {expires ? `, with automatic release around ${expires} if it times out` : ""}.
            </p>
          </div>
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
          Rechecks worker availability, reserves the assignment, then sends an
          M-Pesa prompt.
        </p>
      )}
    </div>
  );
}
