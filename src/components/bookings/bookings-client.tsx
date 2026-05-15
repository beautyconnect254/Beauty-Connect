"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { BookingCard } from "@/components/bookings/booking-card";
import type { Booking, BookingStatus, BookingType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BookingsClientProps {
  bookings: Booking[];
}

type BookingFilterStatus = Extract<BookingStatus, "pending" | "confirmed" | "paid">;

const tabs: Array<{ value: BookingFilterStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "paid", label: "Paid" },
];

const bookingTypes: Array<{ value: BookingType; label: string }> = [
  { value: "team", label: "Team Booking" },
  { value: "worker", label: "Single Booking" },
];

const BOOKING_TAB_MEMORY_KEY = "bc-bookings-tab-memory";

function isBookingType(value: string | null): value is BookingType {
  return value === "team" || value === "worker";
}

function isBookingFilterStatus(
  value: string | null,
): value is BookingFilterStatus {
  return value === "pending" || value === "confirmed" || value === "paid";
}

function readStoredTabMemory(): {
  status: BookingFilterStatus | null;
  type: BookingType | null;
} | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(BOOKING_TAB_MEMORY_KEY) ?? "{}",
    ) as { type?: string; status?: string };
    const storedType = stored.type ?? null;
    const storedStatus = stored.status ?? null;

    return {
      type: isBookingType(storedType) ? storedType : null,
      status: isBookingFilterStatus(storedStatus) ? storedStatus : null,
    };
  } catch {
    window.localStorage.removeItem(BOOKING_TAB_MEMORY_KEY);
    return null;
  }
}

export function BookingsClient({ bookings }: BookingsClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeType, setActiveType] = useState<BookingType>(() => {
    const queryType = searchParams.get("type");
    const stored = readStoredTabMemory();

    return isBookingType(queryType) ? queryType : stored?.type ?? "team";
  });
  const [activeTab, setActiveTab] = useState<BookingFilterStatus>(() => {
    const queryStatus = searchParams.get("status");
    const stored = readStoredTabMemory();

    return isBookingFilterStatus(queryStatus)
      ? queryStatus
      : stored?.status ?? "pending";
  });
  const allBookings = useMemo(() => bookings, [bookings]);
  const bookingListQuery = `type=${activeType}&status=${activeTab}`;
  const visibleBookings = allBookings.filter((booking) => {
    const matchesStatus =
      activeTab === "confirmed"
        ? booking.status === "confirmed" || booking.status === "payment_pending"
        : booking.status === activeTab;

    return booking.type === activeType && matchesStatus;
  });

  useEffect(() => {
    window.localStorage.setItem(
      BOOKING_TAB_MEMORY_KEY,
      JSON.stringify({ type: activeType, status: activeTab }),
    );

    const params = new URLSearchParams(searchParams.toString());
    params.set("type", activeType);
    params.set("status", activeTab);
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  }, [activeTab, activeType, pathname, searchParams]);

  function updateType(type: BookingType) {
    setActiveType(type);
  }

  function updateTab(status: BookingFilterStatus) {
    setActiveTab(status);
  }

  return (
    <div className="space-y-3">
      <div className="mx-auto flex w-fit max-w-full justify-center rounded-lg border border-[color:var(--border)] bg-white p-1">
        {bookingTypes.map((type) => {
          const count = allBookings.filter((booking) => booking.type === type.value).length;
          const active = activeType === type.value;

          return (
            <button
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs font-extrabold transition sm:px-4",
                active
                  ? "bg-[color:var(--foreground)] text-white"
                  : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]",
              )}
              key={type.value}
              onClick={() => updateType(type.value)}
              type="button"
            >
              <span className="whitespace-nowrap">{type.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-[color:var(--muted)] text-[color:var(--foreground)]",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mx-auto flex w-fit max-w-full justify-center overflow-x-auto rounded-lg border border-[color:var(--border)] bg-white p-1">
        {tabs.map((tab) => {
          const count = allBookings.filter((booking) => {
            const matchesStatus =
              tab.value === "confirmed"
                ? booking.status === "confirmed" ||
                  booking.status === "payment_pending"
                : booking.status === tab.value;

            return booking.type === activeType && matchesStatus;
          }).length;
          const active = activeTab === tab.value;

          return (
            <button
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-extrabold transition sm:px-4",
                active
                  ? "bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white"
                  : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]",
              )}
              key={tab.value}
              onClick={() => updateTab(tab.value)}
              type="button"
            >
              <span className="whitespace-nowrap">{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-[color:var(--muted)] text-[color:var(--foreground)]",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {visibleBookings.length > 0 ? (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {visibleBookings.map((booking) => (
            <BookingCard
              booking={booking}
              href={`/bookings/${booking.id}?${bookingListQuery}`}
              interactive
              key={booking.id}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[color:var(--border)] bg-white p-4 text-sm font-semibold text-[color:var(--muted-foreground)]">
          No {activeTab} {activeType === "team" ? "team" : "single"} bookings yet.
        </div>
      )}
    </div>
  );
}
