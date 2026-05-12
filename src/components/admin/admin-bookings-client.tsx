"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Phone,
  ShieldAlert,
  UserMinus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { defaultPaymentInstructions, paymentInstructionSummary } from "@/lib/booking-workflow";
import type {
  AdminActivityLogRecord,
  Booking,
  BookingStatus,
  BookingType,
  TeamRequestRole,
  Worker,
} from "@/lib/types";
import { availabilityLabel, cn, totalHeadcount } from "@/lib/utils";

interface AdminBookingsClientProps {
  initialBookings: Booking[];
  initialWorkers: Worker[];
  initialActivityLogs: AdminActivityLogRecord[];
  status: Extract<BookingStatus, "pending" | "confirmed" | "paid">;
  type: BookingType;
}

type VerificationDecision = "confirmed_available" | "no_response" | "not_available";

const verificationLabels: Record<VerificationDecision, string> = {
  confirmed_available: "Confirmed Available",
  no_response: "No Response",
  not_available: "Not Available",
};

function statusTitle(status: AdminBookingsClientProps["status"]) {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "paid":
      return "Paid";
    default:
      return status;
  }
}

function typeTitle(type: BookingType) {
  return type === "team" ? "Team" : "Single";
}

function getRoleRequests(booking: Booking): TeamRequestRole[] {
  if (booking.team_request?.requested_roles.length) {
    return booking.team_request.requested_roles;
  }

  const worker = booking.workers[0];

  if (!worker) {
    return [];
  }

  return [
    {
      id: `${booking.id}-single-role`,
      team_request_id: booking.team_request_id ?? booking.id,
      role: worker.primary_role,
      quantity: 1,
      min_experience: Math.max(worker.years_of_experience - 1, 0),
      specialties: worker.skills.slice(0, 3),
    },
  ];
}

function workerConflict(
  worker: Worker,
  booking: Booking,
  allBookings: Booking[],
) {
  if (worker.availability_status === "reserved") {
    return "Already Reserved";
  }

  if (worker.availability_status === "hired") {
    return "Already Hired";
  }

  const pendingElsewhere = allBookings.some(
    (item) =>
      item.id !== booking.id &&
      item.status === "pending" &&
      item.worker_ids.includes(worker.id),
  );

  if (pendingElsewhere) {
    return "Pending Elsewhere";
  }

  return "";
}

function scoreWorker(worker: Worker, role: TeamRequestRole) {
  const specialtyMatches = role.specialties.filter((specialty) =>
    worker.skills.some((skill) => skill.id === specialty.id),
  );

  return (
    specialtyMatches.length * 30 +
    Math.max(worker.years_of_experience - role.min_experience, 0) * 5 +
    20
  );
}

function matchesRole(worker: Worker, role: TeamRequestRole) {
  const specialtyMatch =
    role.specialties.length === 0 ||
    role.specialties.some((specialty) =>
      worker.skills.some((workerSkill) => workerSkill.id === specialty.id),
    );

  return (
    worker.primary_role === role.role &&
    worker.years_of_experience >= role.min_experience &&
    specialtyMatch
  );
}

async function readAdminError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return body?.error || "Could not save booking update.";
}

async function persistAdminBookingAction(
  bookingId: string,
  payload:
    | {
        action: "confirm";
        workerIds: string[];
      }
    | {
        action: "verify_payment";
        paymentReference: string;
        workerIds: string[];
      },
) {
  const response = await fetch(`/api/admin/bookings/${bookingId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readAdminError(response));
  }
}

export function AdminBookingsClient({
  initialBookings,
  initialWorkers,
  initialActivityLogs,
  status,
  type,
}: AdminBookingsClientProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [workers, setWorkers] = useState(initialWorkers);
  const [activityLogs, setActivityLogs] = useState(initialActivityLogs);
  const visibleBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === status && booking.type === type)
        .sort(
          (left, right) =>
            new Date(right.submitted_at).getTime() -
            new Date(left.submitted_at).getTime(),
        ),
    [bookings, status, type],
  );
  const [selectedId, setSelectedId] = useState(visibleBookings[0]?.id ?? "");
  const [verification, setVerificationState] = useState<
    Record<string, Record<string, VerificationDecision>>
  >({});
  const [paymentRefs, setPaymentRefs] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const activeBooking =
    visibleBookings.find((booking) => booking.id === selectedId) ??
    visibleBookings[0] ??
    null;

  function appendActivity(
    log: Omit<AdminActivityLogRecord, "id" | "created_at" | "actor">,
  ) {
    setActivityLogs((current) => [
      {
        ...log,
        id: `activity-${Date.now().toString(36)}-${current.length}`,
        actor: "Admin",
        created_at: new Date().toISOString(),
      },
      ...current,
    ]);
  }

  function setVerification(
    booking: Booking,
    worker: Worker,
    decision: VerificationDecision,
  ) {
    setVerificationState((current) => ({
      ...current,
      [booking.id]: {
        ...current[booking.id],
        [worker.id]: decision,
      },
    }));

    setBookings((current) =>
      current.map((item) =>
        item.id === booking.id
          ? {
              ...item,
              worker_ids:
                decision === "confirmed_available"
                  ? Array.from(new Set([...item.worker_ids, worker.id]))
                  : item.worker_ids.filter((workerId) => workerId !== worker.id),
              workers:
                decision === "confirmed_available"
                  ? Array.from(
                      new Map(
                        [...item.workers, worker].map((candidate) => [
                          candidate.id,
                          candidate,
                        ]),
                      ).values(),
                    )
                  : item.workers.filter((candidate) => candidate.id !== worker.id),
              worker_count:
                decision === "confirmed_available"
                  ? Array.from(new Set([...item.worker_ids, worker.id])).length
                  : item.worker_ids.filter((workerId) => workerId !== worker.id).length,
            }
          : item,
      ),
    );

    setNotice(`${worker.full_name}: ${verificationLabels[decision]}.`);
  }

  function removeWorkerFromBooking(booking: Booking, workerId: string) {
    setBookings((current) =>
      current.map((item) =>
        item.id === booking.id
          ? {
              ...item,
              worker_ids: item.worker_ids.filter((id) => id !== workerId),
              workers: item.workers.filter((worker) => worker.id !== workerId),
              worker_count: Math.max(item.worker_count - 1, 0),
            }
          : item,
      ),
    );
  }

  async function confirmBooking(booking: Booking) {
    const decisions = verification[booking.id] ?? {};
    const confirmedWorkerIds = Object.entries(decisions)
      .filter(([, decision]) => decision === "confirmed_available")
      .map(([workerId]) => workerId);
    const confirmedWorkers = workers.filter((worker) =>
      confirmedWorkerIds.includes(worker.id),
    );
    const blockedWorker = confirmedWorkers.find(
      (worker) => workerConflict(worker, booking, bookings) !== "",
    );

    if (confirmedWorkers.length === 0) {
      setNotice("Confirm at least one worker as available before moving the booking.");
      return;
    }

    if (blockedWorker) {
      setNotice(
        `${blockedWorker.full_name} is ${workerConflict(blockedWorker, booking, bookings).toLowerCase()}. Remove the conflict before confirming.`,
      );
      return;
    }

    setBookings((current) =>
      current.map((item) =>
        item.id === booking.id
          ? {
              ...item,
              status: "confirmed",
              payment_status: "deposit_due",
              worker_ids: confirmedWorkerIds,
              workers: confirmedWorkers,
              worker_count: confirmedWorkers.length,
              payment_instructions:
                item.payment_instructions ??
                defaultPaymentInstructions({
                  id: item.id,
                  type: item.type,
                  worker_count: confirmedWorkers.length,
                }),
              payment_verification: {
                status: "not_submitted",
                submitted_reference: null,
                verified_by: null,
                verified_at: null,
                notes: "Awaiting manual deposit verification.",
              },
            }
          : item,
      ),
    );

    setWorkers((current) =>
      current.map((worker) =>
        confirmedWorkerIds.includes(worker.id)
          ? {
              ...worker,
              availability_status: "reserved",
              active_assignment: {
                team_request_id: booking.team_request_id ?? booking.id,
                salon_name: booking.team_request?.salon_name ?? booking.title,
                status: "reserved",
                assigned_at: new Date().toISOString(),
              },
            }
          : worker,
      ),
    );

    appendActivity({
      type: "booking_confirmed",
      message: `${booking.title} moved from pending to confirmed.`,
      booking_id: booking.id,
      worker_id: null,
    });

    confirmedWorkers.forEach((worker) => {
      appendActivity({
        type: "worker_reserved",
        message: `${worker.full_name} reserved for ${booking.title}.`,
        booking_id: booking.id,
        worker_id: worker.id,
      });
    });

    try {
      await persistAdminBookingAction(booking.id, {
        action: "confirm",
        workerIds: confirmedWorkerIds,
      });
      setNotice(`${booking.title} confirmed. Selected workers are now reserved.`);
    } catch (error) {
      setNotice(
        `${booking.title} updated in this view, but could not save: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async function verifyPayment(booking: Booking) {
    const reference =
      paymentRefs[booking.id]?.trim() ||
      booking.payment_verification?.submitted_reference ||
      booking.payment_instructions?.payment_reference ||
      `MANUAL-${booking.id.toUpperCase()}`;
    const workerIds = booking.worker_ids;

    setBookings((current) =>
      current.map((item) =>
        item.id === booking.id
          ? {
              ...item,
              status: "paid",
              payment_status: "deposit_paid",
              payment_verification: {
                status: "verified",
                submitted_reference: reference,
                verified_by: "Admin",
                verified_at: new Date().toISOString(),
                notes: "Deposit verified manually. Worker contacts released.",
              },
            }
          : item,
      ),
    );

    setWorkers((current) =>
      current.map((worker) =>
        workerIds.includes(worker.id)
          ? {
              ...worker,
              availability_status: "hired",
              active_assignment: worker.active_assignment
                ? {
                    ...worker.active_assignment,
                    status: "hired",
                  }
                : {
                    team_request_id: booking.team_request_id ?? booking.id,
                    salon_name: booking.team_request?.salon_name ?? booking.title,
                    status: "hired",
                    assigned_at: new Date().toISOString(),
                  },
            }
          : worker,
      ),
    );

    appendActivity({
      type: "payment_confirmed",
      message: `${booking.title} payment verified manually with reference ${reference}.`,
      booking_id: booking.id,
      worker_id: null,
    });

    booking.workers.forEach((worker) => {
      appendActivity({
        type: "worker_released",
        message: `${worker.full_name} contact details released to the client.`,
        booking_id: booking.id,
        worker_id: worker.id,
      });
    });

    try {
      await persistAdminBookingAction(booking.id, {
        action: "verify_payment",
        paymentReference: reference,
        workerIds,
      });
      setNotice(`${booking.title} moved to paid. Worker contacts are released.`);
    } catch (error) {
      setNotice(
        `${booking.title} updated in this view, but could not save: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  function renderWorkerRow(booking: Booking, worker: Worker, role?: TeamRequestRole) {
    const conflict = workerConflict(worker, booking, bookings);
    const decision = verification[booking.id]?.[worker.id];
    const matchedSpecialties = role
      ? role.specialties.filter((specialty) =>
          worker.skills.some((skill) => skill.id === specialty.id),
        )
      : [];

    return (
      <div
        key={`${booking.id}-${role?.id ?? "worker"}-${worker.id}`}
        className={cn(
          "rounded-md border p-3",
          conflict
            ? "border-amber-200 bg-amber-50"
            : decision === "confirmed_available"
              ? "border-emerald-200 bg-emerald-50"
              : "border-[color:var(--border)] bg-white",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[color:var(--muted)]">
            {worker.profile_photo ? (
              <Image
                src={worker.profile_photo}
                alt={worker.full_name}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                {worker.full_name}
              </p>
              <Badge variant={conflict ? "pending" : "outline"}>
                {conflict || availabilityLabel(worker.availability_status)}
              </Badge>
              {decision ? <Badge variant="verified">{verificationLabels[decision]}</Badge> : null}
            </div>
            <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
              {worker.primary_role} - {worker.years_of_experience} yrs - score{" "}
              {role ? scoreWorker(worker, role) : 20}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(matchedSpecialties.length > 0 ? matchedSpecialties : worker.skills.slice(0, 3)).map(
                (skill) => (
                  <Badge key={skill.id} variant="outline" className="normal-case">
                    {skill.name}
                  </Badge>
                ),
              )}
            </div>
          </div>
        </div>

        {status === "pending" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={Boolean(conflict)}
              onClick={() => setVerification(booking, worker, "confirmed_available")}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Confirmed Available
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVerification(booking, worker, "no_response")}
            >
              No Response
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVerification(booking, worker, "not_available")}
            >
              Not Available
            </Button>
            {booking.worker_ids.includes(worker.id) ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeWorkerFromBooking(booking, worker.id)}
              >
                <UserMinus className="h-3.5 w-3.5" />
                Remove
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  function renderPendingWorkflow(booking: Booking) {
    const roleRequests = getRoleRequests(booking);

    return (
      <div className="space-y-4">
        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-[color:var(--border)] bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
              Requested roles
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
              {roleRequests.length > 0
                ? roleRequests.map((role) => `${role.quantity} ${role.role}`).join(", ")
                : "Single requested worker"}
            </p>
          </div>
          <div className="rounded-md border border-[color:var(--border)] bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
              Quantity
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
              {roleRequests.length ? totalHeadcount(roleRequests) : booking.worker_count}
            </p>
          </div>
          <div className="rounded-md border border-[color:var(--border)] bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
              Experience
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
              {roleRequests.length
                ? `${Math.min(...roleRequests.map((role) => role.min_experience))}+ yrs`
                : "Requested worker profile"}
            </p>
          </div>
          <div className="rounded-md border border-[color:var(--border)] bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
              Client
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-[color:var(--foreground)]">
              {booking.team_request?.contact_name ?? booking.notes}
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                Suggested Workers
              </p>
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Auto-matched by role, sub-specialty, availability, and experience.
              </p>
            </div>
            <Button onClick={() => void confirmBooking(booking)}>
              <ClipboardCheck className="h-4 w-4" />
              Confirm booking
            </Button>
          </div>

          {roleRequests.map((role) => {
            const roleMatches = workers.filter((worker) => matchesRole(worker, role));
            const suggestions = roleMatches
              .filter(
                (worker) =>
                  worker.verification_status === "verified" &&
                  workerConflict(worker, booking, bookings) === "",
              )
              .sort((left, right) => scoreWorker(right, role) - scoreWorker(left, role));
            const conflicts = roleMatches.filter(
              (worker) => workerConflict(worker, booking, bookings) !== "",
            );

            return (
              <div key={role.id} className="space-y-3 rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                      {role.role}
                    </p>
                    <p className="text-xs text-[color:var(--muted-foreground)]">
                      {role.quantity} needed - {role.min_experience}+ yrs minimum
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {role.specialties.map((specialty) => (
                      <Badge key={specialty.id} variant="outline" className="normal-case">
                        {specialty.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {suggestions.length > 0 ? (
                  <div className="grid gap-2 lg:grid-cols-2">
                    {suggestions.slice(0, 6).map((worker) =>
                      renderWorkerRow(booking, worker, role),
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-[color:var(--border)] bg-white p-3 text-sm text-[color:var(--muted-foreground)]">
                    No available verified worker currently matches this role.
                  </div>
                )}

                {conflicts.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-amber-800">
                      <ShieldAlert className="h-4 w-4" />
                      Conflict indicators
                    </div>
                    <div className="grid gap-2 lg:grid-cols-2">
                      {conflicts.slice(0, 4).map((worker) =>
                        renderWorkerRow(booking, worker, role),
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>
      </div>
    );
  }

  function renderConfirmedWorkflow(booking: Booking) {
    const instructions =
      booking.payment_instructions ??
      defaultPaymentInstructions({
        id: booking.id,
        type: booking.type,
        worker_count: booking.worker_count,
      });

    return (
      <div className="space-y-4">
        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-[color:var(--border)] bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
              Reserved workers
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
              {booking.workers.map((worker) => worker.full_name).join(", ")}
            </p>
          </div>
          <div className="rounded-md border border-[color:var(--border)] bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
              Client contact
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
              {booking.team_request?.contact_whatsapp ?? "Stored in booking notes"}
            </p>
          </div>
          <div className="rounded-md border border-[color:var(--border)] bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
              Payment status
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
              {paymentInstructionSummary(instructions)}
            </p>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-2">
            <p className="text-sm font-extrabold text-[color:var(--foreground)]">
              Reserved workers
            </p>
            <div className="grid gap-2 lg:grid-cols-2">
              {booking.workers.map((worker) => renderWorkerRow(booking, worker))}
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-[color:var(--border)] bg-white p-3">
            <div>
              <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                Manual payment verification
              </p>
              <p className="mt-1 text-xs leading-5 text-[color:var(--muted-foreground)]">
                No gateway is connected. Confirm the deposit reference after checking
                M-Pesa or bank records.
              </p>
            </div>
            <Input
              value={paymentRefs[booking.id] ?? booking.payment_verification?.submitted_reference ?? ""}
              onChange={(event) =>
                setPaymentRefs((current) => ({
                  ...current,
                  [booking.id]: event.target.value,
                }))
              }
              placeholder="Payment reference"
            />
            <Textarea value={instructions.notes} readOnly className="min-h-20" />
            <div className="grid gap-2">
              <Button onClick={() => void verifyPayment(booking)}>
                <BadgeCheck className="h-4 w-4" />
                Verify payment manually
              </Button>
              {booking.team_request?.contact_whatsapp ? (
                <a
                  href={`https://wa.me/${booking.team_request.contact_whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[color:var(--border)] bg-white px-3 text-sm font-extrabold text-[color:var(--foreground)] hover:bg-[color:var(--muted)]"
                >
                  <Phone className="h-4 w-4" />
                  Contact client
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderPaidWorkflow(booking: Booking) {
    return (
      <div className="space-y-4">
        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-[color:var(--border)] bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
              Released workers
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
              {booking.worker_count}
            </p>
          </div>
          <div className="rounded-md border border-[color:var(--border)] bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
              Hire date
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
              {format(parseISO(booking.booking_date), "MMM d, yyyy")}
            </p>
          </div>
          <div className="rounded-md border border-[color:var(--border)] bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
              Payment confirmation
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
              {booking.payment_verification?.submitted_reference ??
                booking.payment_instructions?.payment_reference ??
                "Verified manually"}
            </p>
          </div>
        </section>

        <div className="grid gap-2 lg:grid-cols-2">
          {booking.workers.map((worker) => (
            <div
              key={worker.id}
              className="rounded-md border border-emerald-200 bg-emerald-50 p-3"
            >
              <div className="flex items-start gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[color:var(--muted)]">
                  {worker.profile_photo ? (
                    <Image
                      src={worker.profile_photo}
                      alt={worker.full_name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                      {worker.full_name}
                    </p>
                    <Badge variant="verified">Released</Badge>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
                    {worker.whatsapp_number}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                    {worker.primary_role} - worker status: hired
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader className="border-b border-[color:var(--border)]">
          <CardTitle>
            {statusTitle(status)} {typeTitle(type)}
          </CardTitle>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            {visibleBookings.length} booking{visibleBookings.length === 1 ? "" : "s"}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {visibleBookings.map((booking) => (
            <button
              key={booking.id}
              type="button"
              onClick={() => setSelectedId(booking.id)}
              className={cn(
                "w-full rounded-md border p-3 text-left transition",
                activeBooking?.id === booking.id
                  ? "border-[color:var(--foreground)] bg-[color:var(--muted)]"
                  : "border-[color:var(--border)] bg-white hover:bg-[color:var(--muted)]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-[color:var(--foreground)]">
                    {booking.title}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                    {format(parseISO(booking.booking_date), "MMM d")} -{" "}
                    {booking.worker_count} worker{booking.worker_count === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge variant="outline">{booking.type === "team" ? "Team" : "Single"}</Badge>
              </div>
            </button>
          ))}

          {visibleBookings.length === 0 ? (
            <div className="rounded-md border border-dashed border-[color:var(--border)] p-4 text-sm text-[color:var(--muted-foreground)]">
              No {statusTitle(status).toLowerCase()} {typeTitle(type).toLowerCase()} bookings.
            </div>
          ) : null}
        </CardContent>
      </Card>

      {activeBooking ? (
        <Card>
          <CardHeader className="border-b border-[color:var(--border)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>{activeBooking.title}</CardTitle>
                <p className="mt-1 text-sm leading-5 text-[color:var(--muted-foreground)]">
                  {activeBooking.notes}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{statusTitle(status)}</Badge>
                <Badge variant="outline">{typeTitle(type)}</Badge>
              </div>
            </div>
            {notice ? (
              <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]">
                {notice}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {status === "pending" ? renderPendingWorkflow(activeBooking) : null}
            {status === "confirmed" ? renderConfirmedWorkflow(activeBooking) : null}
            {status === "paid" ? renderPaidWorkflow(activeBooking) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="xl:col-span-2">
        <CardHeader className="border-b border-[color:var(--border)]">
          <CardTitle>Activity Log</CardTitle>
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
