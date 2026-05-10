import { format, parseISO } from "date-fns";

import { DashboardMetricCard } from "@/components/admin/dashboard-metric-card";
import { PageIntro } from "@/components/shared/page-intro";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDashboardMetrics,
  getStaffingAssignments,
  getTeamRequests,
  getWorkers,
} from "@/lib/data-access";
import {
  assignmentStatusLabel,
  availabilityLabel,
  compactRoles,
  requestStatusLabel,
  urgencyLabel,
  verificationLabel,
} from "@/lib/utils";

export default function AdminDashboardPage() {
  const metrics = getDashboardMetrics();
  const requests = getTeamRequests();
  const workers = getWorkers();
  const assignments = getStaffingAssignments();

  const urgentRequests = requests.filter(
    (request) => request.urgency !== "standard" && request.status !== "completed",
  );
  const verificationQueue = workers.filter(
    (worker) => worker.verification_status !== "verified",
  );
  const staffingPipeline = ["new", "reviewing", "staffing", "completed"] as const;

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Admin operations"
        title="Run Worker Requests From One Screen"
        description="Track worker readiness, urgent requests, assignments, and verification work."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <DashboardMetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Staffing pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {staffingPipeline.map((status) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-[22px] bg-[color:var(--secondary)] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-[color:var(--foreground)]">
                    {requestStatusLabel(status)}
                  </p>
                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    {
                      requests.filter((request) => request.status === status).reduce(
                        (total, request) => total + request.open_headcount,
                        0,
                      )
                    }{" "}
                    open seats in this stage
                  </p>
                </div>
                <p className="text-2xl font-semibold text-[color:var(--foreground)]">
                  {requests.filter((request) => request.status === status).length}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Urgent action queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {urgentRequests.length > 0 ? (
              urgentRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[color:var(--foreground)]">
                        {request.salon_name}
                      </p>
                      <p className="text-sm text-[color:var(--muted-foreground)]">
                        {request.location} · {compactRoles(request.requested_roles)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{urgencyLabel(request.urgency)}</Badge>
                      <Badge variant="outline">{requestStatusLabel(request.status)}</Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
                    {request.open_headcount} seats still open before{" "}
                    {format(parseISO(request.target_start_date), "MMM d, yyyy")}.
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[color:var(--border)] p-4 text-sm leading-6 text-[color:var(--muted-foreground)]">
                No urgent or priority requests need intervention right now.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Live assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignments
              .filter(
                (assignment) =>
                  assignment.status === "reserved" || assignment.status === "hired",
              )
              .map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
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
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {verificationQueue.map((worker) => (
              <div
                key={worker.id}
                className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">
                      {worker.full_name}
                    </p>
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                      {worker.primary_role} · {worker.location}
                    </p>
                  </div>
                  <Badge
                    variant={
                      worker.verification_status === "pending"
                        ? "pending"
                        : "critical"
                    }
                  >
                    {verificationLabel(worker.verification_status)}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
                  {worker.internal_notes[0]?.note ?? "Awaiting admin verification notes."}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Availability coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["available", "reserved", "hired", "unavailable"] as const).map(
              (status) => (
                <div
                  key={status}
                  className="flex items-center justify-between rounded-[22px] bg-[color:var(--secondary)] px-4 py-3"
                >
                  <p className="text-sm font-medium text-[color:var(--foreground)]">
                    {availabilityLabel(status)}
                  </p>
                  <p className="text-lg font-semibold text-[color:var(--foreground)]">
                    {
                      workers.filter((worker) => worker.availability_status === status)
                        .length
                    }
                  </p>
                </div>
              ),
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest internal notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ...requests.flatMap((request) => request.internal_notes),
              ...workers.flatMap((worker) => worker.internal_notes),
            ]
              .sort(
                (left, right) =>
                  new Date(right.created_at).getTime() -
                  new Date(left.created_at).getTime(),
              )
              .slice(0, 5)
              .map((note) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
