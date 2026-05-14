import { format, parseISO } from "date-fns";
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Eye,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import {
  AdminDashboardCharts,
  type AvailabilityPoint,
  type BookingActivityPoint,
  type SpecialtyPerformancePoint,
  type UserActivityPoint,
} from "@/components/admin/admin-dashboard-charts";
import { PageIntro } from "@/components/shared/page-intro";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAdminActivityLogsAsync,
  getBookingsAsync,
  getRoleSpecialtyCatalogAsync,
  getWorkersAsync,
} from "@/lib/data-access";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { AdminActivityLogRecord, Booking, BookingStatus, Worker } from "@/lib/types";
import { availabilityLabel, cn } from "@/lib/utils";
import { bookingStatusLabel } from "@/lib/booking-workflow";

type KpiTone = "purple" | "emerald" | "amber" | "rose" | "slate";

interface KpiItem {
  label: string;
  value: string;
  detail: string;
  tone: KpiTone;
}

interface SiteVisitRow {
  user_id: string | null;
  session_id: string;
  created_at: string;
}

interface AuthUserRow {
  id: string;
  created_at?: string;
  last_sign_in_at?: string | null;
}

interface ActivityFeedItem {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  tone: KpiTone;
}

const chartWindowDays = 14;

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

function toneClasses(tone: KpiTone) {
  switch (tone) {
    case "emerald":
      return "from-emerald-500/12 to-emerald-500/0 text-emerald-700 ring-emerald-500/20";
    case "amber":
      return "from-amber-500/14 to-amber-500/0 text-amber-700 ring-amber-500/20";
    case "rose":
      return "from-rose-500/14 to-rose-500/0 text-rose-700 ring-rose-500/20";
    case "slate":
      return "from-slate-500/12 to-slate-500/0 text-slate-700 ring-slate-500/20";
    default:
      return "from-purple-500/14 to-purple-500/0 text-purple-700 ring-purple-500/20";
  }
}

function dayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function chartDays() {
  const today = new Date();

  return Array.from({ length: chartWindowDays }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (chartWindowDays - 1 - index));

    return {
      key: dayKey(date),
      label: format(date, "MMM d"),
    };
  });
}

async function getSiteVisitMetrics() {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return {
      totalVisits: 0,
      visits: [] as SiteVisitRow[],
    };
  }

  const from = new Date();
  from.setDate(from.getDate() - (chartWindowDays - 1));

  const [{ count }, { data, error }] = await Promise.all([
    supabase.from("site_visits").select("id", { count: "exact", head: true }),
    supabase
      .from("site_visits")
      .select("user_id, session_id, created_at")
      .gte("created_at", from.toISOString())
      .order("created_at", { ascending: true })
      .limit(5000),
  ]);

  if (error || !data) {
    return {
      totalVisits: 0,
      visits: [] as SiteVisitRow[],
    };
  }

  return {
    totalVisits: count ?? data.length,
    visits: data as SiteVisitRow[],
  };
}

async function getAuthUsers() {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return [] as AuthUserRow[];
  }

  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error || !data?.users) {
    return [] as AuthUserRow[];
  }

  return data.users.map((user) => ({
    id: user.id,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
  }));
}

async function getBookingStatusCounts(bookings: Booking[]) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return bookings.reduce<Record<BookingStatus, number>>(
      (counts, booking) => ({
        ...counts,
        [booking.status]: counts[booking.status] + 1,
      }),
      {
        pending: 0,
        confirmed: 0,
        payment_pending: 0,
        paid: 0,
        expired: 0,
        cancelled: 0,
      },
    );
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("status")
    .limit(5000);

  if (error || !data) {
    return bookings.reduce<Record<BookingStatus, number>>(
      (counts, booking) => ({
        ...counts,
        [booking.status]: counts[booking.status] + 1,
      }),
      {
        pending: 0,
        confirmed: 0,
        payment_pending: 0,
        paid: 0,
        expired: 0,
        cancelled: 0,
      },
    );
  }

  return (data as Array<{ status: BookingStatus }>).reduce<Record<BookingStatus, number>>(
    (counts, booking) => ({
      ...counts,
      [booking.status]: (counts[booking.status] ?? 0) + 1,
    }),
    {
      pending: 0,
      confirmed: 0,
      payment_pending: 0,
      paid: 0,
      expired: 0,
      cancelled: 0,
    },
  );
}

function buildBookingActivity(bookings: Booking[]): BookingActivityPoint[] {
  return chartDays().map((day) => {
    const daily = bookings.filter((booking) => dayKey(booking.submitted_at) === day.key);

    return {
      label: day.label,
      bookings: daily.length,
      confirmed: daily.filter(
        (booking) =>
          booking.status === "confirmed" ||
          booking.status === "payment_pending" ||
          booking.status === "paid",
      ).length,
      paid: daily.filter((booking) => booking.status === "paid").length,
    };
  });
}

function buildUserActivity(
  visits: SiteVisitRow[],
  users: AuthUserRow[],
  bookings: Booking[],
): UserActivityPoint[] {
  return chartDays().map((day) => {
    const visitUsers = new Set(
      visits
        .filter((visit) => dayKey(visit.created_at) === day.key)
        .map((visit) => visit.user_id ?? visit.session_id),
    );
    const bookingUsers = new Set(
      bookings
        .filter((booking) => dayKey(booking.submitted_at) === day.key && booking.user_id)
        .map((booking) => booking.user_id as string),
    );

    return {
      label: day.label,
      activeUsers: Math.max(visitUsers.size, bookingUsers.size),
      signups: users.filter((user) => dayKey(user.created_at ?? "") === day.key).length,
    };
  });
}

function buildSpecialtyPerformance(
  bookings: Booking[],
  roles: string[],
): SpecialtyPerformancePoint[] {
  const counts = new Map(roles.map((role) => [role, 0]));

  bookings.forEach((booking) => {
    const bookingRoles =
      booking.workers.length > 0
        ? booking.workers.map((worker) => worker.primary_role)
        : booking.request_details?.roles?.map((role) => role.role) ?? [];

    bookingRoles.forEach((role) => {
      counts.set(role, (counts.get(role) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([specialty, count]) => ({
      specialty,
      bookings: count,
    }))
    .sort((first, second) => second.bookings - first.bookings)
    .slice(0, 8);
}

function buildAvailability(workers: Worker[]): AvailabilityPoint[] {
  const paymentLocked = workers.filter(
    (worker) => worker.availability_status === "reserved",
  ).length;
  const hired = workers.filter((worker) => worker.availability_status === "hired").length;
  const available = workers.filter(
    (worker) =>
      worker.availability_status === "available" &&
      worker.listed_publicly &&
      worker.verification_status === "verified",
  ).length;
  const hidden = Math.max(workers.length - paymentLocked - hired - available, 0);

  return [
    { name: "Available", value: available, color: "#16a34a" },
    { name: "Payment Locked", value: paymentLocked, color: "#f97316" },
    { name: "Hired", value: hired, color: "#2563eb" },
    { name: "Hidden", value: hidden, color: "#64748b" },
  ];
}

function activityTitle(type: AdminActivityLogRecord["type"]) {
  switch (type) {
    case "booking_confirmed":
      return "Booking confirmed";
    case "payment_confirmed":
      return "Payment received";
    case "worker_reserved":
      return "Worker reserved";
    case "worker_released":
      return "Worker contact released";
    default:
      return "Worker updated";
  }
}

function buildActivityFeed(
  logs: AdminActivityLogRecord[],
  users: AuthUserRow[],
): ActivityFeedItem[] {
  const logItems = logs.map((log) => ({
    id: log.id,
    title: activityTitle(log.type),
    detail: log.message,
    createdAt: log.created_at,
    tone:
      log.type === "payment_confirmed"
        ? "emerald"
        : log.type === "booking_confirmed"
          ? "purple"
          : "slate",
  })) satisfies ActivityFeedItem[];
  const signupItems = users
    .filter((user) => user.created_at)
    .slice(0, 10)
    .map((user) => ({
      id: `signup-${user.id}`,
      title: "User signed up",
      detail: "New marketplace account created.",
      createdAt: user.created_at as string,
      tone: "emerald" as const,
    }));

  return [...logItems, ...signupItems]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, 10);
}

function KpiCard({ item, flat = false }: { item: KpiItem; flat?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--border)] p-3 shadow-sm",
        flat
          ? "bg-white"
          : cn("bg-gradient-to-br ring-1", toneClasses(item.tone)),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
          {item.label}
        </p>
        <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
      </div>
      <p className="mt-2 text-2xl font-black tracking-normal text-[color:var(--foreground)]">
        {item.value}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[color:var(--muted-foreground)]">
        {item.detail}
      </p>
    </div>
  );
}

function KpiSection({
  title,
  items,
  flat = false,
}: {
  title: string;
  items: KpiItem[];
  flat?: boolean;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase text-[color:var(--foreground)]">
          {title}
        </h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <KpiCard key={item.label} item={item} flat={flat} />
        ))}
      </div>
    </section>
  );
}

export default async function AdminDashboardPage() {
  const [bookings, workers, roleCatalog, activityLogs, visitMetrics, authUsers] =
    await Promise.all([
      getBookingsAsync(),
      getWorkersAsync(),
      getRoleSpecialtyCatalogAsync(),
      getAdminActivityLogsAsync(),
      getSiteVisitMetrics(),
      getAuthUsers(),
    ]);
  const bookingStatusCounts = await getBookingStatusCounts(bookings);
  const knownUserIds = new Set(bookings.map((booking) => booking.user_id).filter(Boolean));
  const totalUsers = authUsers.length || knownUserIds.size;
  const today = dayKey(new Date());
  const activeUsersToday = Math.max(
    new Set(
      visitMetrics.visits
        .filter((visit) => dayKey(visit.created_at) === today)
        .map((visit) => visit.user_id ?? visit.session_id),
    ).size,
    new Set(
      bookings
        .filter((booking) => dayKey(booking.submitted_at) === today && booking.user_id)
        .map((booking) => booking.user_id as string),
    ).size,
  );
  const conversionRate =
    visitMetrics.totalVisits > 0 ? (totalUsers / visitMetrics.totalVisits) * 100 : 0;
  const activeListings = workers.filter(
    (worker) => worker.listed_publicly && worker.verification_status === "verified",
  ).length;
  const availableWorkers = workers.filter(
    (worker) =>
      worker.availability_status === "available" &&
      worker.verification_status === "verified",
  ).length;
  const hiredWorkers = workers.filter(
    (worker) => worker.availability_status === "hired",
  ).length;
  const hiddenWorkers = workers.filter(
    (worker) => !worker.listed_publicly || worker.verification_status !== "verified",
  ).length;
  const marketplaceMetrics: KpiItem[] = [
    {
      label: "Total Website Visits",
      value: formatNumber(visitMetrics.totalVisits),
      detail: "Tracked first-party page views.",
      tone: "purple",
    },
    {
      label: "Registered Users",
      value: formatNumber(totalUsers),
      detail: "Supabase auth accounts.",
      tone: "emerald",
    },
    {
      label: "Active Users Today",
      value: formatNumber(activeUsersToday),
      detail: "Unique users or sessions today.",
      tone: "amber",
    },
    {
      label: "Visitor to Signup",
      value: formatPercent(conversionRate),
      detail: "Registered users against visits.",
      tone: "slate",
    },
  ];
  const workerMetrics: KpiItem[] = [
    {
      label: "Total Workers",
      value: formatNumber(workers.length),
      detail: "Complete admin roster.",
      tone: "purple",
    },
    {
      label: "Active Listings",
      value: formatNumber(activeListings),
      detail: "Verified and visible.",
      tone: "emerald",
    },
    {
      label: "Available Workers",
      value: formatNumber(availableWorkers),
      detail: "Verified workers ready for matching.",
      tone: "emerald",
    },
    {
      label: "Hired Workers",
      value: formatNumber(hiredWorkers),
      detail: "Marked hired in operations.",
      tone: "purple",
    },
    {
      label: "Hidden / Inactive",
      value: formatNumber(hiddenWorkers),
      detail: "Internal, pending, rejected, or hidden.",
      tone: "slate",
    },
  ];
  const bookingMetrics: KpiItem[] = [
    {
      label: "Pending Bookings",
      value: formatNumber(bookingStatusCounts.pending),
      detail: "Need availability review.",
      tone: "amber",
    },
    {
      label: "Confirmed Bookings",
      value: formatNumber(
        bookingStatusCounts.confirmed + bookingStatusCounts.payment_pending,
      ),
      detail: "Includes internal payment locks.",
      tone: "purple",
    },
    {
      label: "Paid Bookings",
      value: formatNumber(bookingStatusCounts.paid),
      detail: "Contacts released to clients.",
      tone: "emerald",
    },
    {
      label: "Expired / Failed",
      value: formatNumber(bookingStatusCounts.expired + bookingStatusCounts.cancelled),
      detail: "Inactive or failed payment outcomes.",
      tone: "rose",
    },
  ];
  const bookingActivity = buildBookingActivity(bookings);
  const specialtyPerformance = buildSpecialtyPerformance(
    bookings,
    roleCatalog.map((role) => role.role),
  );
  const availability = buildAvailability(workers);
  const userActivity = buildUserActivity(visitMetrics.visits, authUsers, bookings);
  const activityFeed = buildActivityFeed(activityLogs, authUsers);

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Admin operations"
        title="Operations Dashboard"
        description="Compact marketplace health, worker supply, booking motion, payment readiness, and activity visibility."
      />

      <div className="rounded-lg border border-[color:var(--border)] bg-white/85 p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-100 text-purple-700">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-[color:var(--foreground)]">
                Marketplace Pulse
              </p>
              <p className="text-xs font-semibold text-[color:var(--muted-foreground)]">
                {format(new Date(), "MMM d, yyyy")} snapshot
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-[color:var(--foreground)]">
                {availableWorkers} available
              </p>
              <p className="text-xs font-semibold text-[color:var(--muted-foreground)]">
                Verified worker supply
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-[color:var(--foreground)]">
                {bookingStatusCounts.pending} pending
              </p>
              <p className="text-xs font-semibold text-[color:var(--muted-foreground)]">
                Waiting on ops action
              </p>
            </div>
          </div>
        </div>
      </div>

      <KpiSection title="Marketplace Metrics" items={marketplaceMetrics} flat />
      <KpiSection title="Worker Metrics" items={workerMetrics} />
      <KpiSection title="Booking Metrics" items={bookingMetrics} flat />

      <AdminDashboardCharts
        bookingActivity={bookingActivity}
        specialtyPerformance={specialtyPerformance}
        availability={availability}
        userActivity={userActivity}
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="bg-white/90">
          <CardHeader className="border-b border-[color:var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <CardTitle className="text-base">Latest Bookings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden border-b border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)] md:grid md:grid-cols-[1.2fr_0.6fr_0.55fr_0.55fr]">
              <span>Booking</span>
              <span>Status</span>
              <span>Type</span>
              <span>Date</span>
            </div>
            <div className="divide-y divide-[color:var(--border)]">
              {bookings.slice(0, 7).map((booking) => (
                <div
                  key={booking.id}
                  className="grid gap-2 px-3 py-3 md:grid-cols-[1.2fr_0.6fr_0.55fr_0.55fr] md:items-center"
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

        <Card className="bg-white/90">
          <CardHeader className="border-b border-[color:var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <CardTitle className="text-base">Availability Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(["available", "reserved", "hired"] as const).map((status) => (
              <div
                key={status}
                className="flex items-center justify-between gap-3 rounded-md border border-[color:var(--border)] bg-white px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {status === "available" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : status === "reserved" ? (
                    <Sparkles className="h-4 w-4 text-purple-600" />
                  ) : (
                    <BriefcaseBusiness className="h-4 w-4 text-teal-700" />
                  )}
                  <span className="text-sm font-extrabold text-[color:var(--foreground)]">
                    {status === "reserved" ? "Payment Locked" : availabilityLabel(status)}
                  </span>
                </div>
                <span className="text-lg font-black text-[color:var(--foreground)]">
                  {
                    workers.filter((worker) => worker.availability_status === status)
                      .length
                  }
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 rounded-md border border-[color:var(--border)] bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-extrabold text-[color:var(--foreground)]">
                  Hidden / Inactive
                </span>
              </div>
              <span className="text-lg font-black text-[color:var(--foreground)]">
                {hiddenWorkers}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/90">
        <CardHeader className="border-b border-[color:var(--border)] pb-3">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {activityFeed.map((item) => (
            <div
              key={item.id}
              className={cn(
                "rounded-md border border-[color:var(--border)] bg-gradient-to-br p-3 ring-1",
                toneClasses(item.tone),
              )}
            >
              <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
                {format(parseISO(item.createdAt), "MMM d, HH:mm")}
              </p>
              <p className="mt-1 text-sm font-black text-[color:var(--foreground)]">
                {item.title}
              </p>
              <p className="mt-1 text-sm leading-5 text-[color:var(--muted-foreground)]">
                {item.detail}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
