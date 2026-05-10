import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { PaymentInstructionsCard } from "@/components/bookings/payment-instructions-card";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  bookingStatusClass,
  bookingStatusLabel,
  defaultPaymentInstructions,
} from "@/lib/booking-workflow";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  BookingRequestDetails,
  BookingStatus,
  BookingType,
  PaymentInstructions,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface TrackPageProps {
  params: Promise<{ token: string }>;
}

interface TrackedWorker {
  id: string;
  full_name: string;
  primary_role: string;
  whatsapp_number: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requestDetails(value: unknown): BookingRequestDetails {
  return isObject(value) ? (value as BookingRequestDetails) : {};
}

function paymentInstructions(value: unknown): PaymentInstructions | null {
  if (!isObject(value)) {
    return null;
  }

  return value as unknown as PaymentInstructions;
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function statusCopy(status: BookingStatus) {
  switch (status) {
    case "pending":
      return {
        title: "Booking received",
        body: "Beauty Connect is checking workers and confirming availability.",
        icon: Clock3,
      };
    case "confirmed":
      return {
        title: "Workers secured",
        body: "Your workers are reserved. Please pay the deposit using the instructions below.",
        icon: ShieldCheck,
      };
    case "paid":
      return {
        title: "Workers released",
        body: "Payment has been verified. Worker contacts are now available.",
        icon: CheckCircle2,
      };
    default:
      return {
        title: "Booking closed",
        body: "This booking is no longer active.",
        icon: Clock3,
      };
  }
}

function roleCount(details: BookingRequestDetails) {
  return (
    details.roles?.reduce((total, role) => total + Number(role.quantity || 0), 0) ?? 0
  );
}

export default async function TrackBookingPage({ params }: TrackPageProps) {
  const { token } = await params;
  const supabase = createSupabaseServerClient();

  if (!supabase || !token) {
    notFound();
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("tracking_token", token)
    .maybeSingle();

  if (error || !booking) {
    notFound();
  }

  const [{ data: bookingWorkers }, { data: paymentVerification }] =
    await Promise.all([
      supabase
        .from("booking_workers")
        .select("worker_id")
        .eq("booking_id", booking.id),
      supabase
        .from("payment_verifications")
        .select("*")
        .eq("booking_id", booking.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
  const workerIds = bookingWorkers?.map((item) => item.worker_id) ?? [];
  const { data: workers } =
    workerIds.length > 0
      ? await supabase
          .from("workers")
          .select("id, full_name, primary_role, whatsapp_number")
          .in("id", workerIds)
      : { data: [] };
  const trackedWorkers = (workers ?? []) as TrackedWorker[];
  const details = requestDetails(booking.request_details);
  const bookingType = booking.type as BookingType;
  const status = booking.status as BookingStatus;
  const workerCount =
    trackedWorkers.length ||
    roleCount(details) ||
    (details.requested_worker?.id ? 1 : 0) ||
    1;
  const instructions =
    paymentInstructions(booking.payment_instructions) ??
    (status === "confirmed"
      ? defaultPaymentInstructions({
          id: booking.id,
          type: bookingType,
          worker_count: workerCount,
        })
      : null);
  const copy = statusCopy(status);
  const StatusIcon = copy.icon;

  return (
    <SiteShell>
      <main className="mx-auto w-full max-w-3xl space-y-3 px-3 py-4 sm:px-5 lg:py-6">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-[color:var(--muted-foreground)]">
                  Booking tracking
                </p>
                <h1 className="mt-1 text-xl font-extrabold text-[color:var(--foreground)] sm:text-2xl">
                  {booking.title}
                </h1>
              </div>
              <Badge className={cn("normal-case", bookingStatusClass(status))}>
                {bookingStatusLabel(status)}
              </Badge>
            </div>

            <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] p-3">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-[color:var(--foreground)]">
                  <StatusIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-extrabold text-[color:var(--foreground)]">
                    {copy.title}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[color:var(--muted-foreground)]">
                    {copy.body}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <InfoBlock label="Booking type" value={bookingType === "team" ? "Team" : "Single"} />
              <InfoBlock
                label="Date"
                value={format(parseISO(booking.booking_date), "MMM d, yyyy")}
              />
              <InfoBlock label="Workers" value={String(workerCount)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-base font-extrabold text-[color:var(--foreground)]">
              Booking details
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <InfoBlock
                label="Salon"
                value={details.client?.salon_name ?? "Not provided"}
              />
              <InfoBlock
                label="Location"
                value={details.client?.location ?? "Not provided"}
              />
              <InfoBlock
                label="Contact person"
                value={details.client?.contact_name ?? "Not provided"}
              />
              <InfoBlock
                label="Phone / WhatsApp"
                value={details.client?.contact_whatsapp ?? "Not provided"}
              />
            </div>

            {details.roles?.length ? (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
                  Requested team
                </p>
                {details.roles.map((role) => (
                  <div
                    key={`${role.role}-${role.quantity}`}
                    className="rounded-md border border-[color:var(--border)] bg-white p-3"
                  >
                    <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                      {role.quantity} x {role.role}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[color:var(--muted-foreground)]">
                      {role.experience_label ?? `${role.min_experience ?? 0}+ years`}{" "}
                      experience
                    </p>
                    {role.specialty_names?.length ? (
                      <p className="mt-1 text-xs leading-5 text-[color:var(--muted-foreground)]">
                        {role.specialty_names.join(", ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {details.requested_worker ? (
              <div className="rounded-md border border-[color:var(--border)] bg-white p-3">
                <p className="text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
                  Requested worker
                </p>
                <p className="mt-1 text-sm font-extrabold text-[color:var(--foreground)]">
                  {details.requested_worker.name ?? "Selected worker"}
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  {details.requested_worker.role}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {status === "confirmed" && instructions ? (
          <PaymentInstructionsCard instructions={instructions} />
        ) : null}

        {status !== "paid" ? (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                Worker contacts are hidden for now.
              </p>
              <p className="mt-1 text-sm leading-5 text-[color:var(--muted-foreground)]">
                Contacts will show here after Beauty Connect confirms payment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-3 p-4">
              <h2 className="text-base font-extrabold text-[color:var(--foreground)]">
                Worker contacts
              </h2>
              {trackedWorkers.length > 0 ? (
                trackedWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className="rounded-md border border-emerald-200 bg-emerald-50 p-3"
                  >
                    <p className="font-extrabold text-[color:var(--foreground)]">
                      {worker.full_name}
                    </p>
                    <p className="text-xs text-[color:var(--muted-foreground)]">
                      {worker.primary_role}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                      <p className="flex items-center gap-2 text-sm font-extrabold text-[color:var(--foreground)]">
                        <Phone className="h-4 w-4" />
                        {worker.whatsapp_number}
                      </p>
                      <a
                        href={`https://wa.me/${normalizePhone(worker.whatsapp_number)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button className="w-full sm:w-auto">WhatsApp</Button>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-[color:var(--border)] p-3 text-sm text-[color:var(--muted-foreground)]">
                  Payment is marked paid, but worker contacts have not been attached yet.
                  Beauty Connect will update this link.
                </p>
              )}
              {paymentVerification?.submitted_reference ? (
                <p className="flex items-center gap-2 rounded-md bg-[color:var(--muted)] px-3 py-2 text-xs font-bold text-[color:var(--muted-foreground)]">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Payment ref: {paymentVerification.submitted_reference}
                </p>
              ) : null}
            </CardContent>
          </Card>
        )}

        <p className="px-1 text-center text-xs font-semibold leading-5 text-[color:var(--muted-foreground)]">
          Save this link. It works even if you clear browser data or open it on
          another phone.
        </p>
      </main>
    </SiteShell>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[color:var(--muted)] p-3">
      <p className="text-[10px] font-bold uppercase text-[color:var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-extrabold text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
