"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2,
  ClipboardCheck,
  ShieldAlert,
  UserMinus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { activeBookingCountLabel } from "@/lib/capacity-rules";
import {
  bookingLocksWorkers,
  compensationSummary,
  defaultCommissionPercentage,
  defaultCompensationType,
  defaultPaymentInstructions,
  defaultSalaryExpectation,
  normalizeCommissionPercentage,
  paymentInstructionSummary,
} from "@/lib/booking-workflow";
import {
  formatExperienceMonths,
  minimumExperienceMonths,
  workerExperienceMonths,
} from "@/lib/experience";
import type {
  AdminActivityLogRecord,
  Booking,
  BookingStatus,
  BookingType,
  BookingWorkerAssignmentRecord,
  CompensationType,
  TeamRequestRole,
  Worker,
} from "@/lib/types";
import { availabilityLabel, cn, formatCurrency, totalHeadcount } from "@/lib/utils";

interface AdminBookingsClientProps {
  initialBookings: Booking[];
  initialWorkers: Worker[];
  initialActivityLogs: AdminActivityLogRecord[];
  status: Extract<BookingStatus, "pending" | "confirmed" | "payment_pending" | "paid">;
  type: BookingType;
  capacityLimit: number;
}

type VerificationDecision = "confirmed_available" | "no_response" | "not_available";
type CompensationDraft = {
  compensationType: CompensationType;
  salaryExpectation: string;
  commissionPercentage: string;
};

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
    case "payment_pending":
      return "Payment Pending";
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
      min_experience_months: Math.max(workerExperienceMonths(worker) - 12, 0),
      specialties: worker.skills.slice(0, 3),
    },
  ];
}

function workerActiveBookingCount(
  worker: Worker,
  allBookings: Booking[],
  excludeBookingId?: string,
) {
  return allBookings.filter(
    (item) =>
      item.id !== excludeBookingId &&
      bookingLocksWorkers(item.status) &&
      item.worker_ids.includes(worker.id),
  ).length;
}

function workerConflict(
  worker: Worker,
  booking: Booking,
  allBookings: Booking[],
  capacityLimit: number,
) {
  const activeElsewhere = workerActiveBookingCount(
    worker,
    allBookings,
    booking.id,
  );

  if (activeElsewhere >= capacityLimit) {
    return `At capacity (${activeElsewhere}/${capacityLimit})`;
  }

  return "";
}

function scoreWorker(worker: Worker, role: TeamRequestRole) {
  const specialtyMatches = role.specialties.filter((specialty) =>
    worker.skills.some((skill) => skill.id === specialty.id),
  );

  return (
    specialtyMatches.length * 30 +
    (Math.max(
      workerExperienceMonths(worker) - minimumExperienceMonths(role),
      0,
    ) /
      12) *
      5 +
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
    workerExperienceMonths(worker) >= minimumExperienceMonths(role) &&
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
  payload: {
    action: "confirm";
    workerIds: string[];
    workerAssignments: Array<{
      workerId: string;
      compensationType: CompensationType;
      salaryExpectation: string;
      commissionPercentage: number | null;
    }>;
    platformFee: number;
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

function compensationDraftFromWorker(worker: Worker): CompensationDraft {
  const compensationType = defaultCompensationType(worker);

  return {
    compensationType,
    salaryExpectation:
      compensationType === "monthly" ? defaultSalaryExpectation(worker) : "",
    commissionPercentage:
      compensationType === "commission"
        ? String(defaultCommissionPercentage(worker) ?? 50)
        : "",
  };
}

function compensationDraftFromAssignment(
  assignment: BookingWorkerAssignmentRecord,
  worker: Worker,
): CompensationDraft {
  return {
    compensationType: assignment.compensation_type,
    salaryExpectation:
      assignment.compensation_type === "monthly"
        ? assignment.salary_expectation || defaultSalaryExpectation(worker)
        : "",
    commissionPercentage:
      assignment.compensation_type === "commission"
        ? String(assignment.commission_percentage ?? 50)
        : "",
  };
}

function initialCompensationState(bookings: Booking[]) {
  return bookings.reduce<Record<string, Record<string, CompensationDraft>>>(
    (state, booking) => {
      state[booking.id] = {};

      booking.workers.forEach((worker) => {
        const assignment = booking.worker_assignments.find(
          (item) => item.worker_id === worker.id,
        );

        state[booking.id][worker.id] = assignment
          ? compensationDraftFromAssignment(assignment, worker)
          : compensationDraftFromWorker(worker);
      });

      return state;
    },
    {},
  );
}

function defaultPlatformFeeDraft(booking: Booking) {
  const instructions =
    booking.payment_instructions ??
    defaultPaymentInstructions({
      id: booking.id,
      type: booking.type,
      worker_count: Math.max(booking.worker_count, 1),
    });

  return String(Math.round(Number(instructions.deposit_amount) || 0));
}

function initialPlatformFeeState(bookings: Booking[]) {
  return bookings.reduce<Record<string, string>>((state, booking) => {
    state[booking.id] = defaultPlatformFeeDraft(booking);

    return state;
  }, {});
}

function normalizePlatformFeeDraft(value: string) {
  const amount = Number(value.replace(/[^\d.]/g, ""));

  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}

function paymentInstructionsWithPlatformFee(
  booking: Booking,
  workerCount: number,
  platformFee: number,
) {
  return {
    ...defaultPaymentInstructions({
      id: booking.id,
      type: booking.type,
      worker_count: Math.max(workerCount, 1),
    }),
    ...(booking.payment_instructions ?? {}),
    deposit_amount: platformFee,
  };
}

function findAssignment(booking: Booking, workerId: string) {
  return booking.worker_assignments.find(
    (assignment) => assignment.worker_id === workerId,
  );
}

export function AdminBookingsClient({
  initialBookings,
  initialWorkers,
  initialActivityLogs,
  status,
  type,
  capacityLimit,
}: AdminBookingsClientProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [workers] = useState(initialWorkers);
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
  const [compensations, setCompensations] = useState(() =>
    initialCompensationState(initialBookings),
  );
  const [platformFees, setPlatformFees] = useState(() =>
    initialPlatformFeeState(initialBookings),
  );
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

    if (decision === "confirmed_available") {
      setCompensations((current) => ({
        ...current,
        [booking.id]: {
          ...current[booking.id],
          [worker.id]:
            current[booking.id]?.[worker.id] ?? compensationDraftFromWorker(worker),
        },
      }));
    }

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
    setCompensations((current) => {
      const bookingDrafts = { ...current[booking.id] };
      delete bookingDrafts[workerId];

      return {
        ...current,
        [booking.id]: bookingDrafts,
      };
    });

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

  function updateCompensationDraft(
    booking: Booking,
    worker: Worker,
    nextDraft: Partial<CompensationDraft>,
  ) {
    setCompensations((current) => {
      const existing =
        current[booking.id]?.[worker.id] ?? compensationDraftFromWorker(worker);
      const compensationType =
        nextDraft.compensationType ?? existing.compensationType;

      return {
        ...current,
        [booking.id]: {
          ...current[booking.id],
          [worker.id]: {
            ...existing,
            ...nextDraft,
            compensationType,
            salaryExpectation:
              compensationType === "monthly"
                ? nextDraft.salaryExpectation ?? existing.salaryExpectation
                : "",
            commissionPercentage:
              compensationType === "commission"
                ? (nextDraft.commissionPercentage ??
                    existing.commissionPercentage) || "50"
                : "",
          },
        },
      };
    });
  }

  function buildWorkerAssignment(booking: Booking, worker: Worker) {
    const draft =
      compensations[booking.id]?.[worker.id] ?? compensationDraftFromWorker(worker);
    const commissionPercentage = normalizeCommissionPercentage(
      draft.commissionPercentage,
    );

    return {
      workerId: worker.id,
      compensationType: draft.compensationType,
      salaryExpectation:
        draft.compensationType === "monthly" ? draft.salaryExpectation.trim() : "",
      commissionPercentage:
        draft.compensationType === "commission" ? commissionPercentage : null,
    };
  }

  function updatePlatformFee(booking: Booking, value: string) {
    setPlatformFees((current) => ({
      ...current,
      [booking.id]: value,
    }));
  }

  function assignmentRecordFromDraft(
    booking: Booking,
    worker: Worker,
  ): BookingWorkerAssignmentRecord {
    const assignment = buildWorkerAssignment(booking, worker);

    return {
      booking_id: booking.id,
      worker_id: worker.id,
      compensation_type: assignment.compensationType,
      salary_expectation: assignment.salaryExpectation,
      commission_percentage: assignment.commissionPercentage,
    };
  }

  async function confirmBooking(booking: Booking) {
    const decisions = verification[booking.id] ?? {};
    const confirmedWorkerIds = Object.entries(decisions)
      .filter(([, decision]) => decision === "confirmed_available")
      .map(([workerId]) => workerId);
    const confirmedWorkers = workers.filter((worker) =>
      confirmedWorkerIds.includes(worker.id),
    );
    const workerAssignments = confirmedWorkers.map((worker) =>
      buildWorkerAssignment(booking, worker),
    );
    const blockedWorker = confirmedWorkers.find(
      (worker) => workerConflict(worker, booking, bookings, capacityLimit) !== "",
    );
    const platformFee = normalizePlatformFeeDraft(platformFees[booking.id] ?? "");

    if (confirmedWorkers.length === 0) {
      setNotice("Confirm at least one worker as available before moving the booking.");
      return;
    }

    if (platformFee === null) {
      setNotice("Enter the global platform fee the client will pay.");
      return;
    }

    const invalidAssignment = workerAssignments.find((assignment) =>
      assignment.compensationType === "monthly"
        ? !assignment.salaryExpectation
        : assignment.commissionPercentage === null,
    );

    if (invalidAssignment) {
      setNotice(
        invalidAssignment.compensationType === "monthly"
          ? "Enter salary expectation for each monthly worker."
          : "Enter commission percentage for each commission worker.",
      );
      return;
    }

    if (blockedWorker) {
      setNotice(
        `${blockedWorker.full_name} is ${workerConflict(
          blockedWorker,
          booking,
          bookings,
          capacityLimit,
        ).toLowerCase()}. Remove the conflict before confirming.`,
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
              worker_assignments: confirmedWorkers.map((worker) => ({
                ...assignmentRecordFromDraft(booking, worker),
                worker,
              })),
              worker_count: confirmedWorkers.length,
              payment_instructions: paymentInstructionsWithPlatformFee(
                item,
                confirmedWorkers.length,
                platformFee,
              ),
              payment_verification: {
                status: "not_submitted",
                submitted_reference: null,
                verified_by: null,
                verified_at: null,
                notes: "Awaiting Daraja payment callback.",
              },
            }
          : item,
      ),
    );

    appendActivity({
      type: "booking_confirmed",
      message: `${booking.title} moved from pending to confirmed with compensation terms.`,
      booking_id: booking.id,
      worker_id: null,
    });

    try {
      await persistAdminBookingAction(booking.id, {
        action: "confirm",
        workerIds: confirmedWorkerIds,
        workerAssignments,
        platformFee,
      });
      setNotice(
        `${booking.title} confirmed with ${formatCurrency(platformFee)} platform fee.`,
      );
    } catch (error) {
      setNotice(
        `${booking.title} updated in this view, but could not save: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  function renderWorkerRow(booking: Booking, worker: Worker, role?: TeamRequestRole) {
    const conflict = workerConflict(worker, booking, bookings, capacityLimit);
    const activeCount = workerActiveBookingCount(worker, bookings);
    const decision = verification[booking.id]?.[worker.id];
    const matchedSpecialties = role
      ? role.specialties.filter((specialty) =>
          worker.skills.some((skill) => skill.id === specialty.id),
        )
      : [];
    const assignment = findAssignment(booking, worker.id);
    const draft =
      compensations[booking.id]?.[worker.id] ??
      (assignment
        ? compensationDraftFromAssignment(assignment, worker)
        : compensationDraftFromWorker(worker));
    const showCompensationControls =
      status === "pending" && decision === "confirmed_available";

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
              <Badge variant="outline">
                {activeBookingCountLabel(activeCount)}
              </Badge>
              {decision ? <Badge variant="verified">{verificationLabels[decision]}</Badge> : null}
            </div>
            <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
              {worker.primary_role} -{" "}
              {formatExperienceMonths(workerExperienceMonths(worker))} - score{" "}
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
            {assignment && status !== "pending" ? (
              <p className="mt-2 rounded-md bg-[color:var(--muted)] px-2 py-1 text-xs font-bold text-[color:var(--foreground)]">
                {compensationSummary(assignment)}
              </p>
            ) : null}
          </div>
        </div>

        {showCompensationControls ? (
          <div className="mt-3 grid gap-2 rounded-md border border-[color:var(--border)] bg-white p-2 sm:grid-cols-[150px_minmax(0,1fr)]">
            <Select
              aria-label={`${worker.full_name} compensation type`}
              className="h-9 text-xs font-bold"
              value={draft.compensationType}
              onChange={(event) =>
                updateCompensationDraft(booking, worker, {
                  compensationType: event.target.value as CompensationType,
                })
              }
            >
              <option value="monthly">Monthly</option>
              <option value="commission">Commission</option>
            </Select>
            {draft.compensationType === "monthly" ? (
              <Input
                className="h-9 text-xs font-bold"
                placeholder="KSh 35,000/month"
                value={draft.salaryExpectation}
                onChange={(event) =>
                  updateCompensationDraft(booking, worker, {
                    salaryExpectation: event.target.value,
                  })
                }
              />
            ) : (
              <div className="relative">
                <Input
                  className="h-9 pr-10 text-xs font-bold"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  placeholder="50"
                  type="number"
                  value={draft.commissionPercentage}
                  onChange={(event) =>
                    updateCompensationDraft(booking, worker, {
                      commissionPercentage: event.target.value,
                    })
                  }
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[color:var(--muted-foreground)]">
                  %
                </span>
              </div>
            )}
          </div>
        ) : null}

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
                ? formatExperienceMonths(
                    Math.min(...roleRequests.map(minimumExperienceMonths)),
                  )
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
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,300px)_auto] lg:items-end">
            <div>
              <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                {booking.type === "worker" ? "Requested Worker" : "Suggested Workers"}
              </p>
              <p className="text-xs text-[color:var(--muted-foreground)]">
                {booking.type === "worker"
                  ? "Single bookings only use the exact worker requested by the client."
                  : "Auto-matched by role, sub-specialty, availability, and experience."}
              </p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2">
              <label
                htmlFor={`platform-fee-${booking.id}`}
                className="text-[10px] font-extrabold uppercase text-emerald-900"
              >
                Platform fee client pays
              </label>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-md bg-white px-2 py-2 text-xs font-extrabold text-emerald-900">
                  KSh
                </span>
                <Input
                  id={`platform-fee-${booking.id}`}
                  className="h-9 bg-white text-sm font-extrabold"
                  inputMode="numeric"
                  value={platformFees[booking.id] ?? ""}
                  onChange={(event) => updatePlatformFee(booking, event.target.value)}
                  placeholder="10000"
                />
              </div>
            </div>
            <Button onClick={() => void confirmBooking(booking)}>
              <ClipboardCheck className="h-4 w-4" />
              Confirm booking
            </Button>
          </div>

          {roleRequests.map((role) => {
            const roleMatches =
              booking.type === "worker"
                ? booking.workers
                : workers.filter((worker) => matchesRole(worker, role));
            const suggestions = roleMatches
              .filter(
                (worker) =>
                  (booking.type === "worker" ||
                    worker.verification_status === "verified") &&
                  workerConflict(worker, booking, bookings, capacityLimit) === "",
              )
              .sort((left, right) => scoreWorker(right, role) - scoreWorker(left, role));
            const conflicts = roleMatches.filter(
              (worker) => workerConflict(worker, booking, bookings, capacityLimit) !== "",
            );

            return (
              <div key={role.id} className="space-y-3 rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                      {role.role}
                    </p>
                    <p className="text-xs text-[color:var(--muted-foreground)]">
                      {role.quantity} needed - {formatExperienceMonths(
                        minimumExperienceMonths(role),
                      )} minimum
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
              Assigned workers
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
              Assigned workers
            </p>
            <div className="grid gap-2 lg:grid-cols-2">
              {booking.workers.map((worker) => renderWorkerRow(booking, worker))}
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-[color:var(--border)] bg-white p-3">
            <div>
              <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                Daraja payment status
              </p>
              <p className="mt-1 text-xs leading-5 text-[color:var(--muted-foreground)]">
                M-Pesa callback is the only source of truth for paid bookings.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="rounded-md bg-[color:var(--muted)] p-3">
                <p className="text-[10px] font-bold uppercase text-[color:var(--muted-foreground)]">
                  Platform fee
                </p>
                <p className="mt-1 text-sm font-extrabold text-[color:var(--foreground)]">
                  {paymentInstructionSummary(instructions)}
                </p>
              </div>
              <div className="rounded-md bg-purple-50 p-3 text-xs font-semibold leading-5 text-purple-900">
                {booking.status === "payment_pending"
                  ? `Payment lock active${
                      booking.payment_lock_expires_at
                        ? ` until ${format(parseISO(booking.payment_lock_expires_at), "HH:mm")}`
                        : ""
                    }. Awaiting Daraja callback.`
                  : "Client can start STK Push from their confirmed booking view."}
              </div>
              <p className="rounded-md border border-[color:var(--border)] px-3 py-2 text-xs font-semibold leading-5 text-[color:var(--muted-foreground)]">
                {instructions.notes}
              </p>
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
                "Daraja confirmed"}
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
                  {findAssignment(booking, worker.id) ? (
                    <p className="mt-2 rounded-md bg-white/80 px-2 py-1 text-xs font-bold text-emerald-900">
                      {compensationSummary(findAssignment(booking, worker.id)!)}
                    </p>
                  ) : null}
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
            {status === "confirmed" || status === "payment_pending"
              ? renderConfirmedWorkflow(activeBooking)
              : null}
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
