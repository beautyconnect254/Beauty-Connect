import {
  adminNotes,
  bookings,
  hires,
  portfolioImages,
  skills,
  staffingAssignments,
  teamRequestRoles,
  teamRequests,
  teamRequestRoleSkills,
  verificationDocuments,
  workerCategories,
  workerReferences,
  workers,
  workerSkills,
} from "@/lib/mock-data";
import type {
  Booking,
  BookingRecord,
  DashboardMetric,
  Hire,
  SkillRecord,
  StaffingAssignment,
  StaffingAssignmentRecord,
  TeamRequest,
  TeamRequestRole,
  TeamRequestRoleRecommendation,
  Worker,
  WorkerRole,
} from "@/lib/types";
import { totalHeadcount } from "@/lib/utils";

function getRoleSkills(roleRequestId: string) {
  return teamRequestRoleSkills
    .filter((item) => item.team_request_role_id === roleRequestId)
    .map((item) => skills.find((skill) => skill.id === item.skill_id))
    .filter((item): item is SkillRecord => Boolean(item));
}

function getHydratedRoles(requestId: string): TeamRequestRole[] {
  return teamRequestRoles
    .filter((role) => role.team_request_id === requestId)
    .map((role) => ({
      ...role,
      specialties: getRoleSkills(role.id),
    }));
}

function getActiveAssignmentForWorker(workerId: string) {
  const activeAssignment = staffingAssignments
    .filter(
      (assignment) =>
        assignment.worker_id === workerId &&
        (assignment.status === "reserved" || assignment.status === "hired"),
    )
    .sort(
      (left, right) =>
        new Date(right.assigned_at).getTime() - new Date(left.assigned_at).getTime(),
    )[0];

  if (!activeAssignment) {
    return null;
  }

  const request = teamRequests.find((item) => item.id === activeAssignment.team_request_id);

  if (!request) {
    return null;
  }

  return {
    team_request_id: request.id,
    salon_name: request.salon_name,
    status: activeAssignment.status,
    assigned_at: activeAssignment.assigned_at,
  };
}

function hydrateWorker(id: string) {
  const worker = workers.find((item) => item.id === id);

  if (!worker) {
    return undefined;
  }

  const relatedSkills = workerSkills
    .filter((item) => item.worker_id === id)
    .map((item) => skills.find((skill) => skill.id === item.skill_id))
    .filter((item): item is SkillRecord => Boolean(item));

  return {
    ...worker,
    skills: relatedSkills,
    portfolio: portfolioImages.filter((item) => item.worker_id === id),
    verification_documents: verificationDocuments.filter(
      (item) => item.worker_id === id,
    ),
    reference_contacts: workerReferences.filter((item) => item.worker_id === id),
    internal_notes: adminNotes.filter((item) => item.worker_id === id),
    active_assignment: getActiveAssignmentForWorker(id),
  } satisfies Worker;
}

function hydrateAssignment(
  assignment: StaffingAssignmentRecord,
): StaffingAssignment | null {
  const worker = hydrateWorker(assignment.worker_id);
  const requestRole = assignment.team_request_role_id
    ? teamRequestRoles.find((role) => role.id === assignment.team_request_role_id)
    : null;

  if (!worker) {
    return null;
  }

  return {
    ...assignment,
    worker,
    request_role: requestRole
      ? {
          ...requestRole,
          specialties: getRoleSkills(requestRole.id),
        }
      : null,
  };
}

function workerHasBlockingAssignment(workerId: string, requestId?: string) {
  return staffingAssignments.some(
    (assignment) =>
      assignment.worker_id === workerId &&
      assignment.team_request_id !== requestId &&
      (assignment.status === "reserved" || assignment.status === "hired"),
  );
}

function isAlreadyAssignedToRequest(workerId: string, requestId: string) {
  return staffingAssignments.some(
    (assignment) =>
      assignment.worker_id === workerId && assignment.team_request_id === requestId,
  );
}

function recommendWorkersForRole(
  roleRequest: TeamRequestRole,
  request: (typeof teamRequests)[number],
  candidates: Worker[],
) {
  return candidates
    .filter((worker) => {
      if (worker.primary_role !== roleRequest.role) {
        return false;
      }

      if (worker.years_of_experience < roleRequest.min_experience) {
        return false;
      }

      if (request.verified_only && worker.verification_status !== "verified") {
        return false;
      }

      if (!worker.listed_publicly && worker.verification_status !== "verified") {
        return false;
      }

      if (worker.location !== request.location) {
        return false;
      }

      if (worker.availability_status !== "available") {
        return false;
      }

      if (workerHasBlockingAssignment(worker.id, request.id)) {
        return false;
      }

      if (isAlreadyAssignedToRequest(worker.id, request.id)) {
        return false;
      }

      if (roleRequest.specialties.length === 0) {
        return true;
      }

      return roleRequest.specialties.some((specialty) =>
        worker.skills.some((skill) => skill.id === specialty.id),
      );
    })
    .map((worker) => {
      const matchedSpecialties = roleRequest.specialties.filter((specialty) =>
        worker.skills.some((skill) => skill.id === specialty.id),
      );
      const reasons = [
        `${worker.years_of_experience} years experience`,
        "Currently available for deployment",
      ];

      if (matchedSpecialties.length > 0) {
        reasons.push(
          `Matches ${matchedSpecialties.length} requested specialt${
            matchedSpecialties.length === 1 ? "y" : "ies"
          }`,
        );
      }

      return {
        worker,
        score:
          matchedSpecialties.length * 30 +
          (worker.years_of_experience - roleRequest.min_experience) * 5 +
          20,
        reasons,
        matched_specialties: matchedSpecialties,
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function getWorkers() {
  return workers
    .map((worker) => hydrateWorker(worker.id))
    .filter((worker): worker is Worker => Boolean(worker))
    .sort((left, right) => {
      if (left.verification_status === right.verification_status) {
        return right.years_of_experience - left.years_of_experience;
      }

      if (left.verification_status === "verified") {
        return -1;
      }

      if (right.verification_status === "verified") {
        return 1;
      }

      return right.years_of_experience - left.years_of_experience;
    });
}

export function getPublicWorkers() {
  return getWorkers().filter(
    (worker) => worker.verification_status === "verified" && worker.listed_publicly,
  );
}

export function getFeaturedWorkers() {
  const now = Date.now();

  return getPublicWorkers()
    .filter((worker) => {
      if (!worker.featured || worker.featured_status !== "active") {
        return false;
      }

      if (!worker.featured_expires_at) {
        return true;
      }

      return new Date(worker.featured_expires_at).getTime() >= now;
    })
    .sort((left, right) => {
      if (left.featured_priority_score === right.featured_priority_score) {
        return right.featured_frequency - left.featured_frequency;
      }

      return right.featured_priority_score - left.featured_priority_score;
    })
    .slice(0, 6);
}

export function getWorkerById(id: string) {
  return hydrateWorker(id);
}

export function getPublicWorkerById(id: string) {
  const worker = hydrateWorker(id);

  if (!worker) {
    return undefined;
  }

  return worker.verification_status === "verified" && worker.listed_publicly
    ? worker
    : undefined;
}

export function getWorkersByRole(role: WorkerRole) {
  return getWorkers().filter((worker) => worker.primary_role === role);
}

export function getPublicWorkersByRole(role: WorkerRole) {
  return getPublicWorkers().filter((worker) => worker.primary_role === role);
}

export function getTeamRequests(): TeamRequest[] {
  const allWorkers = getWorkers();

  return teamRequests
    .map((request) => {
      const requestedRoles = getHydratedRoles(request.id);
      const hydratedAssignments = staffingAssignments
        .filter((assignment) => assignment.team_request_id === request.id)
        .map((assignment) => hydrateAssignment(assignment))
        .filter((assignment): assignment is StaffingAssignment => Boolean(assignment));

      const roleRecommendations: TeamRequestRoleRecommendation[] = requestedRoles.map(
        (roleRequest) => ({
          role_request: roleRequest,
          recommendations: recommendWorkersForRole(roleRequest, request, allWorkers),
        }),
      );

      const filledHeadcount = hydratedAssignments.filter(
        (assignment) =>
          assignment.status === "reserved" || assignment.status === "hired",
      ).length;

      return {
        ...request,
        requested_roles: requestedRoles,
        staffing_assignments: hydratedAssignments,
        internal_notes: adminNotes.filter((note) => note.team_request_id === request.id),
        role_recommendations: roleRecommendations,
        filled_headcount: filledHeadcount,
        open_headcount: Math.max(totalHeadcount(requestedRoles) - filledHeadcount, 0),
      } satisfies TeamRequest;
    })
    .sort(
      (left, right) =>
        new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime(),
    );
}

export function getTeamRequestById(id: string) {
  return getTeamRequests().find((request) => request.id === id);
}

function hydrateBooking(record: BookingRecord): Booking {
  const hydratedWorkers = record.worker_ids
    .map((workerId) => hydrateWorker(workerId))
    .filter((worker): worker is Worker => Boolean(worker));

  return {
    ...record,
    workers: hydratedWorkers,
    team_request: record.team_request_id ? getTeamRequestById(record.team_request_id) ?? null : null,
    worker_count: hydratedWorkers.length,
  };
}

export function getBookings() {
  return bookings
    .filter(
      (booking) =>
        booking.payment_status !== "deposit_paid" && booking.payment_status !== "paid",
    )
    .map((booking) => hydrateBooking(booking))
    .sort(
      (left, right) =>
        new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime(),
    );
}

export function getBookingById(id: string) {
  return getBookings().find((booking) => booking.id === id);
}

export function getHires(): Hire[] {
  return hires
    .map((hire) => {
      const hydratedWorkers = hire.worker_ids
        .map((workerId) => hydrateWorker(workerId))
        .filter((worker): worker is Worker => Boolean(worker));
      const sourceBooking = bookings.find((booking) => booking.id === hire.booking_id);

      return {
        ...hire,
        booking: sourceBooking ? hydrateBooking(sourceBooking) : null,
        workers: hydratedWorkers,
        worker_count: hydratedWorkers.length,
      };
    })
    .sort(
      (left, right) =>
        new Date(right.hire_date).getTime() - new Date(left.hire_date).getTime(),
    );
}

export function getHireById(id: string) {
  return getHires().find((hire) => hire.id === id);
}

export function getRelatedWorkers(worker: Worker) {
  return getPublicWorkers()
    .filter(
      (candidate) =>
        candidate.id !== worker.id &&
        (candidate.primary_role === worker.primary_role ||
          candidate.location === worker.location),
    )
    .slice(0, 3);
}

export function getWorkerCategories() {
  return workerCategories;
}

export function getSkills() {
  return skills;
}

export function getLocations() {
  return Array.from(new Set(workers.map((worker) => worker.location))).sort();
}

export function getSkillsForRole(role: WorkerRole) {
  return skills.filter((skill) => skill.role === role);
}

export function getStaffingAssignments() {
  return staffingAssignments
    .map((assignment) => hydrateAssignment(assignment))
    .filter((assignment): assignment is StaffingAssignment => Boolean(assignment));
}

export function getDashboardMetrics(): DashboardMetric[] {
  const hydratedWorkers = getWorkers();
  const hydratedRequests = getTeamRequests();
  const hydratedAssignments = getStaffingAssignments();

  return [
    {
      label: "Active workers",
      value: String(
        hydratedWorkers.filter((worker) => worker.verification_status !== "rejected")
          .length,
      ),
      detail: "Recruited workers currently in the internal staffing pipeline.",
    },
    {
      label: "Available workers",
      value: String(
        hydratedWorkers.filter(
          (worker) =>
            worker.availability_status === "available" &&
            worker.verification_status === "verified",
        ).length,
      ),
      detail: "Verified workers currently free for matching and reservation.",
    },
    {
      label: "Pending requests",
      value: String(
        hydratedRequests.filter((request) => request.status !== "completed").length,
      ),
      detail: "Owner requests still moving through review, matching, or staffing.",
    },
    {
      label: "Completed placements",
      value: String(
        hydratedAssignments.filter((assignment) => assignment.status === "hired").length,
      ),
      detail: "Workers marked as placed into completed staffing outcomes.",
    },
  ];
}
