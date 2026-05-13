"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Sparkles,
  UserCheck2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  formatExperienceMonths,
  minimumExperienceMonths,
  workerExperienceMonths,
} from "@/lib/experience";
import type {
  StaffingAssignment,
  StaffingAssignmentStatus,
  TeamRequest,
  Worker,
} from "@/lib/types";
import {
  assignmentStatusLabel,
  availabilityLabel,
  compactRoles,
  requestStatusLabel,
  totalHeadcount,
  urgencyLabel,
} from "@/lib/utils";

interface AdminTeamRequestsClientProps {
  initialRequests: TeamRequest[];
  initialWorkers: Worker[];
}

export function AdminTeamRequestsClient({
  initialRequests,
  initialWorkers,
}: AdminTeamRequestsClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [workers, setWorkers] = useState(initialWorkers);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialRequests[0]?.id ?? null,
  );
  const [noteDraft, setNoteDraft] = useState("");
  const [notice, setNotice] = useState("");

  const liveRequests = useMemo(() => {
    const activeAssignments = requests.flatMap((request) => request.staffing_assignments);

    return requests.map((request) => {
      const roleRecommendations = request.requested_roles.map((roleRequest) => ({
        role_request: roleRequest,
        recommendations: workers
          .filter((worker) => {
            if (worker.primary_role !== roleRequest.role) {
              return false;
            }

            if (request.verified_only && worker.verification_status !== "verified") {
              return false;
            }

            if (worker.availability_status !== "available") {
              return false;
            }

            if (workerExperienceMonths(worker) < minimumExperienceMonths(roleRequest)) {
              return false;
            }

            if (worker.location !== request.location) {
              return false;
            }

            if (
              roleRequest.specialties.length > 0 &&
              !roleRequest.specialties.some((skill) =>
                worker.skills.some((workerSkill) => workerSkill.id === skill.id),
              )
            ) {
              return false;
            }

            if (
              activeAssignments.some(
                (assignment) =>
                  assignment.worker.id === worker.id &&
                  assignment.team_request_id !== request.id &&
                  (assignment.status === "reserved" || assignment.status === "hired"),
              )
            ) {
              return false;
            }

            if (
              request.staffing_assignments.some(
                (assignment) => assignment.worker.id === worker.id,
              )
            ) {
              return false;
            }

            return true;
          })
          .map((worker) => {
            const matchedSpecialties = roleRequest.specialties.filter((skill) =>
              worker.skills.some((workerSkill) => workerSkill.id === skill.id),
            );

            return {
              worker,
              matched_specialties: matchedSpecialties,
              score:
                matchedSpecialties.length * 30 +
                (Math.max(
                  workerExperienceMonths(worker) - minimumExperienceMonths(roleRequest),
                  0,
                ) /
                  12) *
                  5 +
                20,
              reasons: [
                formatExperienceMonths(workerExperienceMonths(worker)),
                "Available for staffing deployment",
                matchedSpecialties.length > 0
                  ? `Matches ${matchedSpecialties.length} requested specialties`
                  : "Meets core role skill requirements",
              ],
            };
          })
          .sort((left, right) => right.score - left.score),
      }));

      const filledHeadcount = request.staffing_assignments.filter(
        (assignment) =>
          assignment.status === "reserved" || assignment.status === "hired",
      ).length;

      return {
        ...request,
        role_recommendations: roleRecommendations,
        filled_headcount: filledHeadcount,
        open_headcount: Math.max(totalHeadcount(request.requested_roles) - filledHeadcount, 0),
      };
    });
  }, [requests, workers]);

  const activeRequest =
    liveRequests.find((request) => request.id === selectedId) ?? null;

  function syncWorkersFromRequests(nextRequests: TeamRequest[]) {
    const activeAssignments = nextRequests.flatMap((request) =>
      request.staffing_assignments.filter(
        (assignment) => assignment.status === "reserved" || assignment.status === "hired",
      ),
    );
    const fallbackAvailability = new Map(
      initialWorkers.map((worker) => [
        worker.id,
        worker.active_assignment ? "available" : worker.availability_status,
      ]),
    );

    setWorkers((current) =>
      current.map((worker) => {
        const workerAssignments = activeAssignments.filter(
          (assignment) => assignment.worker.id === worker.id,
        );
        const latestAssignment = workerAssignments.sort(
          (left, right) =>
            new Date(right.assigned_at).getTime() - new Date(left.assigned_at).getTime(),
        )[0];

        if (latestAssignment) {
          const nextRequest = nextRequests.find(
            (request) => request.id === latestAssignment.team_request_id,
          );

          return {
            ...worker,
            availability_status:
              latestAssignment.status === "hired" ? "hired" : "reserved",
            active_assignment: nextRequest
              ? {
                  team_request_id: nextRequest.id,
                  salon_name: nextRequest.salon_name,
                  status: latestAssignment.status,
                  assigned_at: latestAssignment.assigned_at,
                }
              : null,
          };
        }

        return {
          ...worker,
          availability_status:
            (fallbackAvailability.get(worker.id) as Worker["availability_status"]) ??
            "available",
          active_assignment: null,
        };
      }),
    );
  }

  function updateRequestStatus(id: string, status: TeamRequest["status"]) {
    setRequests((current) =>
      current.map((request) =>
        request.id === id ? { ...request, status } : request,
      ),
    );
  }

  function addNote() {
    if (!activeRequest || noteDraft.trim().length === 0) {
      return;
    }

    setRequests((current) =>
      current.map((request) =>
        request.id === activeRequest.id
          ? {
              ...request,
              internal_notes: [
                {
                  id: `${request.id}-note-${Date.now().toString(36)}`,
                  author: "Admin",
                  note: noteDraft.trim(),
                  created_at: new Date().toISOString(),
                  worker_id: null,
                  team_request_id: request.id,
                  staffing_assignment_id: null,
                },
                ...request.internal_notes,
              ],
            }
          : request,
      ),
    );
    setNoteDraft("");
  }

  function updateAssignmentStatus(
    requestId: string,
    roleId: string,
    workerId: string,
    nextStatus: StaffingAssignmentStatus,
  ) {
    const request = liveRequests.find((item) => item.id === requestId);
    const worker = workers.find((item) => item.id === workerId);
    const requestRole = request?.requested_roles.find((role) => role.id === roleId) ?? null;

    if (!request || !worker) {
      return;
    }

    if (nextStatus === "reserved" || nextStatus === "hired") {
      const blockingAssignment = liveRequests
        .flatMap((item) => item.staffing_assignments)
        .find(
          (assignment) =>
            assignment.worker.id === workerId &&
            assignment.team_request_id !== requestId &&
            (assignment.status === "reserved" || assignment.status === "hired"),
        );

      if (blockingAssignment) {
        const blockingRequest = liveRequests.find(
          (item) => item.id === blockingAssignment.team_request_id,
        );
        setNotice(
          `${worker.full_name} is already ${assignmentStatusLabel(
            blockingAssignment.status,
          ).toLowerCase()} on ${blockingRequest?.salon_name ?? "another request"}. Release that assignment first to prevent double-booking.`,
        );
        return;
      }
    }

    let nextRequestsState: TeamRequest[] = [];

    setRequests((current) => {
      nextRequestsState = current.map((item) => {
        if (item.id !== requestId) {
          return item;
        }

        const existingAssignment = item.staffing_assignments.find(
          (assignment) => assignment.worker.id === workerId,
        );

        let nextAssignments: StaffingAssignment[];

        if (existingAssignment) {
          nextAssignments = item.staffing_assignments.map((assignment) =>
            assignment.worker.id === workerId
              ? {
                  ...assignment,
                  status: nextStatus,
                  assigned_at: new Date().toISOString(),
                  notes:
                    nextStatus === "released"
                      ? "Released back to general staffing pool."
                      : assignment.notes,
                }
              : assignment,
          );
        } else {
          nextAssignments = [
            {
              id: `${item.id}-${worker.id}-${Date.now().toString(36)}`,
              team_request_id: item.id,
              team_request_role_id: requestRole?.id ?? null,
              worker_id: worker.id,
              status: nextStatus,
              assigned_by: "Admin",
              assigned_at: new Date().toISOString(),
              notes:
                nextStatus === "recommended"
                  ? "Added to booking list."
                  : nextStatus === "reserved"
                    ? "Reserved for client confirmation."
                    : "Marked as hired.",
              worker,
              request_role: requestRole,
            },
            ...item.staffing_assignments,
          ];
        }

        return {
          ...item,
          status:
            nextStatus === "hired" || nextStatus === "reserved"
              ? "staffing"
              : item.status,
          staffing_assignments: nextAssignments,
        };
      });

      return nextRequestsState;
    });

    syncWorkersFromRequests(nextRequestsState);
    setNotice(
      `${worker.full_name} is now ${assignmentStatusLabel(nextStatus).toLowerCase()} for ${request.salon_name}.`,
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {(["new", "reviewing", "staffing", "completed"] as const).map((status) => (
            <Card key={status}>
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                  {requestStatusLabel(status)}
                </p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[color:var(--foreground)]">
                  {liveRequests.filter((request) => request.status === status).length}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staffing pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {liveRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => {
                  setSelectedId(request.id);
                  setNoteDraft("");
                }}
                className={`w-full rounded-[24px] border p-4 text-left transition ${
                  request.id === selectedId
                    ? "border-[color:var(--primary)] bg-[color:var(--secondary)]"
                    : "border-[color:var(--border)] bg-white/70 hover:bg-[color:var(--secondary)]/60"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">
                      {request.salon_name}
                    </p>
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                      {request.location} · {totalHeadcount(request.requested_roles)} hires
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{urgencyLabel(request.urgency)}</Badge>
                    <Badge variant="outline">{requestStatusLabel(request.status)}</Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
                  {compactRoles(request.requested_roles)}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                  {request.filled_headcount} filled · {request.open_headcount} open
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {activeRequest ? (
        <Card>
          <CardHeader className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle>{activeRequest.salon_name}</CardTitle>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                  {activeRequest.contact_name} · {activeRequest.contact_email} ·{" "}
                  {activeRequest.contact_whatsapp}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{urgencyLabel(activeRequest.urgency)}</Badge>
                <Badge variant="outline">{requestStatusLabel(activeRequest.status)}</Badge>
              </div>
            </div>

            {notice ? (
              <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--secondary)] p-4 text-sm leading-6 text-[color:var(--foreground)]">
                {notice}
              </div>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                  Team request
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
                  {compactRoles(activeRequest.requested_roles)}
                </p>
              </div>
              <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                  Start date
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
                  {format(parseISO(activeRequest.target_start_date), "MMM d, yyyy")}
                </p>
              </div>
              <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                  Filled seats
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
                  {activeRequest.filled_headcount} filled / {totalHeadcount(activeRequest.requested_roles)}
                </p>
              </div>
              <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                  Verified only
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
                  {activeRequest.verified_only ? "Yes" : "No"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-[color:var(--foreground)]">Owner notes</p>
              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4 text-sm leading-7 text-[color:var(--muted-foreground)]">
                {activeRequest.notes}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {(["new", "reviewing", "staffing", "completed"] as const).map((status) => (
                <Button
                  key={status}
                  variant={activeRequest.status === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateRequestStatus(activeRequest.id, status)}
                >
                  {requestStatusLabel(status)}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              <p className="font-semibold text-[color:var(--foreground)]">
                Current assignments
              </p>
              {activeRequest.staffing_assignments.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeRequest.staffing_assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[color:var(--foreground)]">
                            {assignment.worker.full_name}
                          </p>
                          <p className="text-sm text-[color:var(--muted-foreground)]">
                            {assignment.request_role?.role ?? assignment.worker.primary_role} ·{" "}
                            {assignment.worker.location}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {assignmentStatusLabel(assignment.status)}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
                        {assignment.notes}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(["recommended", "reserved", "hired", "released"] as const).map(
                          (status) => (
                            <Button
                              key={status}
                              variant={
                                assignment.status === status ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                updateAssignmentStatus(
                                  activeRequest.id,
                                  assignment.request_role?.id ?? activeRequest.requested_roles[0]?.id ?? "",
                                  assignment.worker.id,
                                  status,
                                )
                              }
                            >
                              {assignmentStatusLabel(status)}
                            </Button>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-[color:var(--border)] p-4 text-sm leading-6 text-[color:var(--muted-foreground)]">
                  No workers have been assigned yet. Use the role recommendations below
                  to begin staffing this request.
                </div>
              )}
            </div>

            <div className="space-y-6">
              <p className="font-semibold text-[color:var(--foreground)]">
                Role recommendations
              </p>
              {activeRequest.role_recommendations.map((roleGroup) => (
                <div key={roleGroup.role_request.id} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[color:var(--foreground)]">
                        {roleGroup.role_request.role}
                      </p>
                      <p className="text-sm text-[color:var(--muted-foreground)]">
                        {roleGroup.role_request.quantity} seats ·{" "}
                        {formatExperienceMonths(
                          minimumExperienceMonths(roleGroup.role_request),
                        )} minimum
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {roleGroup.role_request.specialties.map((specialty) => (
                        <Badge
                          key={specialty.id}
                          variant="outline"
                          className="normal-case tracking-normal"
                        >
                          {specialty.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {roleGroup.recommendations.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {roleGroup.recommendations.slice(0, 4).map((recommendation) => (
                        <div
                          key={`${roleGroup.role_request.id}-${recommendation.worker.id}`}
                          className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-[color:var(--foreground)]">
                                {recommendation.worker.full_name}
                              </p>
                              <p className="text-sm text-[color:var(--muted-foreground)]">
                                {recommendation.worker.location} ·{" "}
                                {formatExperienceMonths(
                                  workerExperienceMonths(recommendation.worker),
                                )}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {availabilityLabel(recommendation.worker.availability_status)}
                            </Badge>
                          </div>

                          <div className="mt-4 space-y-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                            {recommendation.reasons.map((reason) => (
                              <p key={reason}>{reason}</p>
                            ))}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateAssignmentStatus(
                                  activeRequest.id,
                                  roleGroup.role_request.id,
                                  recommendation.worker.id,
                                  "recommended",
                                )
                              }
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              Recommend
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateAssignmentStatus(
                                  activeRequest.id,
                                  roleGroup.role_request.id,
                                  recommendation.worker.id,
                                  "reserved",
                                )
                              }
                            >
                              <UserCheck2 className="mr-2 h-4 w-4" />
                              Reserve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                updateAssignmentStatus(
                                  activeRequest.id,
                                  roleGroup.role_request.id,
                                  recommendation.worker.id,
                                  "hired",
                                )
                              }
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Mark hired
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[color:var(--border)] p-4 text-sm leading-6 text-[color:var(--muted-foreground)]">
                      No workers currently match this role while staying verified,
                      available, and free from conflicting reservations.
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <p className="font-semibold text-[color:var(--foreground)]">Internal notes</p>
              <div className="space-y-3">
                {activeRequest.internal_notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-[color:var(--foreground)]">
                        {note.author}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                        {format(parseISO(note.created_at), "MMM d")}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                      {note.note}
                    </p>
                  </div>
                ))}
              </div>
              <Textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Add an internal staffing note for this request"
              />
              <Button variant="secondary" onClick={addNote}>
                Add note
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-4 w-4 text-[color:var(--primary)]" />
                  <p className="font-semibold text-[color:var(--foreground)]">
                    Open seats
                  </p>
                </div>
                <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                  {activeRequest.open_headcount}
                </p>
              </div>
              <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-[color:var(--primary)]" />
                  <p className="font-semibold text-[color:var(--foreground)]">
                    Reserved or hired
                  </p>
                </div>
                <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                  {activeRequest.filled_headcount}
                </p>
              </div>
              <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                <div className="flex items-center gap-3">
                  <BriefcaseBusiness className="h-4 w-4 text-[color:var(--primary)]" />
                  <p className="font-semibold text-[color:var(--foreground)]">
                    Request status
                  </p>
                </div>
                <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                  {requestStatusLabel(activeRequest.status)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
