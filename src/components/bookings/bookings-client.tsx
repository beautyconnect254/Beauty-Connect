"use client";

import { useMemo, useState } from "react";

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

export function BookingsClient({ bookings }: BookingsClientProps) {
  const [activeType, setActiveType] = useState<BookingType>("team");
  const [activeTab, setActiveTab] = useState<BookingFilterStatus>("pending");
  const allBookings = useMemo(() => bookings, [bookings]);
  const visibleBookings = allBookings.filter((booking) => {
    const matchesStatus =
      activeTab === "confirmed"
        ? booking.status === "confirmed" || booking.status === "payment_pending"
        : booking.status === activeTab;

    return booking.type === activeType && matchesStatus;
  });

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
              onClick={() => setActiveType(type.value)}
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
              onClick={() => setActiveTab(tab.value)}
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
