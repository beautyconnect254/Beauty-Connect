import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowRight, ClipboardList, ShieldCheck, Users } from "lucide-react";

import { DashboardMetricCard } from "@/components/admin/dashboard-metric-card";
import { PageIntro } from "@/components/shared/page-intro";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAdminActivityLogs,
  getBookingsAsync,
  getDashboardMetricsAsync,
  getRoleSpecialtyCatalogAsync,
  getWorkersAsync,
} from "@/lib/data-access";
import { bookingStatusLabel } from "@/lib/booking-workflow";
import { availabilityLabel } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [metrics, bookings, workers, roleCatalog] = await Promise.all([
    getDashboardMetricsAsync(),
    getBookingsAsync(),
    getWorkersAsync(),
    getRoleSpecialtyCatalogAsync(),
  ]);
  const activityLogs = getAdminActivityLogs();
  const pendingBookings = bookings.filter((booking) => booking.status === "pending");
  const confirmedBookings = bookings.filter(
    (booking) => booking.status === "confirmed",
  );
  const availableWorkers = workers.filter(
    (worker) =>
      worker.availability_status === "available" &&
      worker.verification_status === "verified",
  );

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Admin operations"
        title="Staffing Control Room"
        description="Compact view of worker supply, booking stages, reservations, payment verification, and recent internal activity."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <DashboardMetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader className="border-b border-[color:var(--border)]">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <CardTitle>Booking Work Queue</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              {
                label: "Pending team",
                href: "/admin/bookings/pending/team",
                count: pendingBookings.filter((booking) => booking.type === "team").length,
              },
              {
                label: "Pending single",
                href: "/admin/bookings/pending/single",
                count: pendingBookings.filter((booking) => booking.type === "worker").length,
              },
              {
                label: "Confirmed team",
                href: "/admin/bookings/confirmed/team",
                count: confirmedBookings.filter((booking) => booking.type === "team").length,
              },
              {
                label: "Confirmed single",
                href: "/admin/bookings/confirmed/single",
                count: confirmedBookings.filter((booking) => booking.type === "worker").length,
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-md border border-[color:var(--border)] bg-white px-3 py-2 hover:bg-[color:var(--muted)]"
              >
                <span className="text-sm font-extrabold text-[color:var(--foreground)]">
                  {item.label}
                </span>
                <span className="flex items-center gap-2 text-sm font-extrabold text-[color:var(--foreground)]">
                  {item.count}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[color:var(--border)]">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <CardTitle>Worker Availability</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            {(["available", "reserved", "hired"] as const).map((status) => (
              <div
                key={status}
                className="rounded-md border border-[color:var(--border)] bg-white p-3"
              >
                <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
                  {availabilityLabel(status)}
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[color:var(--foreground)]">
                  {
                    workers.filter((worker) => worker.availability_status === status)
                      .length
                  }
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="border-b border-[color:var(--border)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <CardTitle>Live Bookings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden border-b border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)] md:grid md:grid-cols-[1.2fr_0.6fr_0.6fr_0.7fr]">
              <span>Booking</span>
              <span>Status</span>
              <span>Type</span>
              <span>Date</span>
            </div>
            <div className="divide-y divide-[color:var(--border)]">
              {bookings.slice(0, 6).map((booking) => (
                <div
                  key={booking.id}
                  className="grid gap-2 px-3 py-3 md:grid-cols-[1.2fr_0.6fr_0.6fr_0.7fr] md:items-center"
                >
                  <div>
                    <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                      {booking.title}
                    </p>
                    <p className="text-xs text-[color:var(--muted-foreground)]">
                      {booking.worker_count} worker
                      {booking.worker_count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge variant="outline">{bookingStatusLabel(booking.status)}</Badge>
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">
                    {booking.type === "team" ? "Team" : "Single"}
                  </p>
                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    {format(parseISO(booking.booking_date), "MMM d")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[color:var(--border)]">
            <CardTitle>Matching Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-[color:var(--border)] bg-white p-3">
              <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
                Available verified workers
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[color:var(--foreground)]">
                {availableWorkers.length}
              </p>
            </div>
            <div className="grid gap-2">
              {roleCatalog.map((role) => (
                <div
                  key={role.role}
                  className="flex items-center justify-between gap-3 rounded-md border border-[color:var(--border)] bg-white px-3 py-2"
                >
                  <span className="text-sm font-extrabold text-[color:var(--foreground)]">
                    {role.role}
                  </span>
                  <Badge variant="outline">{role.specialties.length} specialties</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-[color:var(--border)]">
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {activityLogs.slice(0, 6).map((log) => (
            <div
              key={log.id}
              className="rounded-md border border-[color:var(--border)] bg-white p-3"
            >
              <p className="text-xs font-extrabold uppercase text-[color:var(--muted-foreground)]">
                {format(parseISO(log.created_at), "MMM d, HH:mm")} - {log.actor}
              </p>
              <p className="mt-1 text-sm leading-5 text-[color:var(--foreground)]">
                {log.message}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
