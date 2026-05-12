import {
  bookingIsActive,
  defaultPaymentInstructions,
} from "@/lib/booking-workflow";
import {
  adminActivityLogs,
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
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import type {
  AvailabilityStatus,
  Booking,
  BookingRecord,
  DashboardMetric,
  FeaturedStatus,
  Hire,
  RoleSpecialtyCatalog,
  SkillRecord,
  StaffingAssignment,
  StaffingAssignmentRecord,
  TeamRequest,
  TeamRequestRole,
  TeamRequestRoleRecommendation,
  VerificationDocumentStatus,
  VerificationStatus,
  Worker,
  WorkerRole,
  WorkType,
} from "@/lib/types";
import { totalHeadcount } from "@/lib/utils";

const availabilityStatuses: AvailabilityStatus[] = [
  "available",
  "reserved",
  "hired",
];
const verificationStatuses: VerificationStatus[] = [
  "pending",
  "verified",
  "rejected",
];
const workTypes: WorkType[] = ["full-time", "part-time", "contract", "freelance"];
const documentStatuses: VerificationDocumentStatus[] = [
  "pending",
  "verified",
  "rejected",
];

function getReadableSupabaseClient() {
  return createSupabaseServiceClient() ?? createSupabaseServerClient();
}

function pickEnumValue<T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T,
) {
  return typeof value === "string" && options.includes(value as T)
    ? (value as T)
    : fallback;
}

function mergeById<T extends { id: string }>(primary: T[], fallback: T[]) {
  const seen = new Set<string>();
  const merged: T[] = [];

  for (const item of [...primary, ...fallback]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }

  return merged;
}

function mergeByName<T extends { name: string }>(primary: T[], fallback: T[]) {
  const seen = new Set<string>();
  const merged: T[] = [];

  for (const item of [...primary, ...fallback]) {
    const key = item.name.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }

  return merged;
}

type SupabaseWorkerRow = {
  id: string;
  full_name: string;
  id_number?: string | null;
  primary_role: string;
  profile_photo: string | null;
  location: string | null;
  years_of_experience: number | null;
  bio: string | null;
  availability_status: string | null;
  verification_status: string | null;
  salary_expectation: number | null;
  work_type: string | null;
  whatsapp_number: string | null;
  headline: string | null;
  featured: boolean | null;
  listed_publicly: boolean | null;
};

async function getSkillsFromSupabase(): Promise<SkillRecord[]> {
  const supabase = getReadableSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("skills")
    .select("id, name, role")
    .order("role", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data
    .filter((skill) => skill.id && skill.name && skill.role)
    .map((skill) => ({
      id: skill.id,
      name: skill.name,
      role: skill.role,
    }));
}

async function getWorkerRolesFromSupabase(): Promise<RoleSpecialtyCatalog[]> {
  const supabase = getReadableSupabaseClient();

  if (!supabase) {
    return [];
  }

  const [{ data: roleRows, error: roleError }, dbSkills] = await Promise.all([
    supabase
      .from("worker_roles")
      .select("id, name, description, typical_team_use")
      .order("name", { ascending: true }),
    getSkillsFromSupabase(),
  ]);

  if (roleError || !roleRows) {
    return [];
  }

  return roleRows
    .filter((role) => role.name)
    .map((role) => ({
      role: role.name,
      description: role.description ?? "",
      typical_team_use: role.typical_team_use ?? "",
      specialties: dbSkills.filter((skill) => skill.role === role.name),
    }));
}

async function getWorkersFromSupabase(): Promise<Worker[]> {
  const supabase = getReadableSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data: workerRows, error: workerError } = await supabase
    .from("workers")
    .select(
      [
        "id",
        "full_name",
        "id_number",
        "primary_role",
        "profile_photo",
        "location",
        "years_of_experience",
        "bio",
        "availability_status",
        "verification_status",
        "salary_expectation",
        "work_type",
        "whatsapp_number",
        "headline",
        "featured",
        "listed_publicly",
      ].join(", "),
    )
    .order("updated_at", { ascending: false });

  if (workerError || !workerRows || workerRows.length === 0) {
    return [];
  }

  const dbWorkerRows = workerRows as unknown as SupabaseWorkerRow[];
  const workerIds = dbWorkerRows.map((worker) => worker.id);
  const [
    dbSkills,
    workerSkillsResult,
    portfolioResult,
    documentsResult,
    referencesResult,
    notesResult,
    assignmentsResult,
  ] = await Promise.all([
    getSkillsFromSupabase(),
    supabase
      .from("worker_skills")
      .select("id, worker_id, skill_id, proficiency_level")
      .in("worker_id", workerIds),
    supabase
      .from("portfolio_images")
      .select("id, worker_id, image_url, caption, is_cover")
      .in("worker_id", workerIds),
    supabase
      .from("verification_documents")
      .select("id, worker_id, document_type, status, file_url, uploaded_at")
      .in("worker_id", workerIds),
    supabase
      .from("worker_references")
      .select("id, worker_id, contact_name, contact_phone, relationship, previous_workplace")
      .in("worker_id", workerIds),
    supabase
      .from("admin_notes")
      .select("id, worker_id, team_request_id, staffing_assignment_id, author, note, created_at")
      .in("worker_id", workerIds),
    supabase
      .from("staffing_assignments")
      .select("id, team_request_id, team_request_role_id, worker_id, status, assigned_by, assigned_at, notes")
      .in("worker_id", workerIds),
  ]);

  const assignmentRows = assignmentsResult.data ?? [];
  const requestIds = Array.from(
    new Set(assignmentRows.map((assignment) => assignment.team_request_id)),
  ).filter(Boolean);
  const { data: requestRows } =
    requestIds.length > 0
      ? await supabase
          .from("team_requests")
          .select("id, salon_name")
          .in("id", requestIds)
      : { data: [] };
  const requestsById = new Map(
    (requestRows ?? []).map((request) => [request.id, request.salon_name]),
  );
  const activeAssignmentsByWorker = new Map<
    string,
    NonNullable<Worker["active_assignment"]>
  >();

  assignmentRows
    .filter(
      (assignment) =>
        assignment.status === "reserved" || assignment.status === "hired",
    )
    .sort(
      (left, right) =>
        new Date(right.assigned_at).getTime() -
        new Date(left.assigned_at).getTime(),
    )
    .forEach((assignment) => {
      if (activeAssignmentsByWorker.has(assignment.worker_id)) {
        return;
      }

      activeAssignmentsByWorker.set(assignment.worker_id, {
        team_request_id: assignment.team_request_id,
        salon_name:
          requestsById.get(assignment.team_request_id) ?? "Assigned salon",
        status: assignment.status,
        assigned_at: assignment.assigned_at,
      });
    });

  const skillsById = new Map(dbSkills.map((skill) => [skill.id, skill]));

  return dbWorkerRows.map((worker) => {
    const featured = Boolean(worker.featured);
    const featuredStatus: FeaturedStatus = featured ? "active" : "off";

    return {
      id: worker.id,
      full_name: worker.full_name,
      id_number: worker.id_number ?? "",
      primary_role: worker.primary_role,
      profile_photo: worker.profile_photo ?? "",
      location: worker.location ?? "Nairobi",
      years_of_experience: Math.max(Number(worker.years_of_experience) || 0, 0),
      bio: worker.bio ?? "",
      availability_status: pickEnumValue(
        worker.availability_status,
        availabilityStatuses,
        "available",
      ),
      verification_status: pickEnumValue(
        worker.verification_status,
        verificationStatuses,
        "pending",
      ),
      salary_expectation: Math.max(Number(worker.salary_expectation) || 0, 0),
      work_type: pickEnumValue(worker.work_type, workTypes, "contract"),
      whatsapp_number: worker.whatsapp_number ?? "",
      headline: worker.headline ?? "",
      featured,
      featured_status: featuredStatus,
      featured_expires_at: null,
      featured_frequency: 0,
      featured_priority_score: featured ? 1 : 0,
      listed_publicly: Boolean(worker.listed_publicly),
      skills: (workerSkillsResult.data ?? [])
        .filter((item) => item.worker_id === worker.id)
        .map((item) => skillsById.get(item.skill_id))
        .filter((item): item is SkillRecord => Boolean(item)),
      portfolio: (portfolioResult.data ?? [])
        .filter((item) => item.worker_id === worker.id)
        .map((item) => ({
          id: item.id,
          worker_id: item.worker_id,
          image_url: item.image_url,
          caption: item.caption ?? "",
          is_cover: Boolean(item.is_cover),
        })),
      verification_documents: (documentsResult.data ?? [])
        .filter((item) => item.worker_id === worker.id)
        .map((item) => ({
          id: item.id,
          worker_id: item.worker_id,
          document_type: item.document_type,
          status: pickEnumValue(item.status, documentStatuses, "pending"),
          file_url: item.file_url ?? "",
          uploaded_at: item.uploaded_at,
        })),
      reference_contacts: (referencesResult.data ?? [])
        .filter((item) => item.worker_id === worker.id)
        .map((item) => ({
          id: item.id,
          worker_id: item.worker_id,
          contact_name: item.contact_name,
          contact_phone: item.contact_phone,
          relationship: item.relationship ?? "",
          previous_workplace: item.previous_workplace ?? "",
        })),
      internal_notes: (notesResult.data ?? [])
        .filter((item) => item.worker_id === worker.id)
        .map((item) => ({
          id: item.id,
          worker_id: item.worker_id,
          team_request_id: item.team_request_id,
          staffing_assignment_id: item.staffing_assignment_id,
          author: item.author,
          note: item.note,
          created_at: item.created_at,
        })),
      active_assignment: activeAssignmentsByWorker.get(worker.id) ?? null,
    };
  });
}

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

export async function getWorkersAsync() {
  return mergeById(await getWorkersFromSupabase(), getWorkers());
}

export function getPublicWorkers() {
  return getWorkers().filter(
    (worker) => worker.verification_status === "verified" && worker.listed_publicly,
  );
}

export async function getPublicWorkersAsync() {
  return (await getWorkersAsync()).filter(
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

export async function getWorkerByIdAsync(id: string) {
  return (await getWorkersAsync()).find((worker) => worker.id === id);
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

export async function getPublicWorkerByIdAsync(id: string) {
  const worker = await getWorkerByIdAsync(id);

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
    payment_instructions:
      record.payment_instructions ??
      (record.status === "confirmed"
        ? defaultPaymentInstructions({
            id: record.id,
            type: record.type,
            worker_count: hydratedWorkers.length || record.worker_ids.length,
          })
        : null),
    workers: hydratedWorkers,
    team_request: record.team_request_id ? getTeamRequestById(record.team_request_id) ?? null : null,
    worker_count: hydratedWorkers.length,
  };
}

export function getBookings() {
  return bookings
    .filter((booking) => bookingIsActive(booking.status))
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

export async function getSkillsAsync() {
  return mergeById(await getSkillsFromSupabase(), skills);
}

export function getRoleSpecialtyCatalog(): RoleSpecialtyCatalog[] {
  return workerCategories.map((category) => ({
    ...category,
    specialties: skills.filter((skill) => skill.role === category.role),
  }));
}

export async function getRoleSpecialtyCatalogAsync(): Promise<RoleSpecialtyCatalog[]> {
  const [dbCatalog, allSkills] = await Promise.all([
    getWorkerRolesFromSupabase(),
    getSkillsAsync(),
  ]);
  const fallbackCatalog = getRoleSpecialtyCatalog();
  const mergedRoles = mergeByName(
    dbCatalog.map((item) => ({
      name: item.role,
      description: item.description,
      typical_team_use: item.typical_team_use,
    })),
    fallbackCatalog.map((item) => ({
      name: item.role,
      description: item.description,
      typical_team_use: item.typical_team_use,
    })),
  );

  return mergedRoles.map((role) => ({
    role: role.name,
    description: role.description,
    typical_team_use: role.typical_team_use,
    specialties: allSkills.filter((skill) => skill.role === role.name),
  }));
}

export function getLocations() {
  return Array.from(new Set(workers.map((worker) => worker.location))).sort();
}

export async function getLocationsAsync() {
  return Array.from(
    new Set((await getWorkersAsync()).map((worker) => worker.location)),
  ).sort();
}

export function getSkillsForRole(role: WorkerRole) {
  return skills.filter((skill) => skill.role === role);
}

export function getStaffingAssignments() {
  return staffingAssignments
    .map((assignment) => hydrateAssignment(assignment))
    .filter((assignment): assignment is StaffingAssignment => Boolean(assignment));
}

export function getAdminActivityLogs() {
  return [...adminActivityLogs].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

export function getDashboardMetrics(): DashboardMetric[] {
  const hydratedWorkers = getWorkers();
  const hydratedAssignments = getStaffingAssignments();
  const hydratedBookings = getBookings();

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
      label: "Pending bookings",
      value: String(
        hydratedBookings.filter((booking) => booking.status === "pending").length,
      ),
      detail: "Bookings waiting on matching and manual worker availability checks.",
    },
    {
      label: "Reserved workers",
      value: String(
        hydratedAssignments.filter((assignment) => assignment.status === "reserved").length,
      ),
      detail: "Workers secured for confirmed bookings and blocked from future matching.",
    },
  ];
}
