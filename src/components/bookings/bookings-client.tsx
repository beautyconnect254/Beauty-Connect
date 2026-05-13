"use client";

import { useMemo, useState } from "react";

import { BookingCard } from "@/components/bookings/booking-card";
import type { Booking, BookingStatus, BookingType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BookingsClientProps {
  bookings: Booking[];
}

const tabs: Array<{ value: BookingStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "payment_pending", label: "Payment" },
  { value: "paid", label: "Paid" },
];

const bookingTypes: Array<{ value: BookingType; label: string }> = [
  { value: "team", label: "Team Bookings" },
  { value: "worker", label: "Single Bookings" },
];

export function BookingsClient({ bookings }: BookingsClientProps) {
  const [activeType, setActiveType] = useState<BookingType>("team");
  const [activeTab, setActiveTab] = useState<BookingStatus>("pending");
  const allBookings = useMemo(() => bookings, [bookings]);
  const visibleBookings = allBookings.filter(
    (booking) => booking.type === activeType && booking.status === activeTab,
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-[color:var(--border)] bg-white p-1">
        {bookingTypes.map((type) => {
          const count = allBookings.filter((booking) => booking.type === type.value).length;
          const active = activeType === type.value;

          return (
            <button
              className={cn(
                "rounded-md px-3 py-2 text-xs font-extrabold transition",
                active
                  ? "bg-[color:var(--foreground)] text-white"
                  : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]",
              )}
              key={type.value}
              onClick={() => setActiveType(type.value)}
              type="button"
            >
              {type.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg border border-[color:var(--border)] bg-white p-1 sm:grid-cols-4">
        {tabs.map((tab) => {
          const count = allBookings.filter(
            (booking) => booking.type === activeType && booking.status === tab.value,
          ).length;
          const active = activeTab === tab.value;

          return (
            <button
              className={cn(
                "rounded-md px-3 py-2 text-xs font-extrabold transition",
                active
                  ? "bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white"
                  : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]",
              )}
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              type="button"
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {visibleBookings.length > 0 ? (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {visibleBookings.map((booking) => (
            <BookingCard
              booking={booking}
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
