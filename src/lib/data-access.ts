import {
  bookingLocksWorkers,
  bookingIsActive,
  defaultCommissionPercentage,
  defaultCompensationType,
  defaultPaymentInstructions,
  defaultSalaryExpectation,
  normalizeCommissionPercentage,
} from "@/lib/booking-workflow";
import {
  DEFAULT_MAX_ACTIVE_BOOKINGS_PER_WORKER,
  WORKER_CAPACITY_SETTING_KEY,
  isActiveBookingStatus,
  normalizeWorkerCapacityLimit,
} from "@/lib/capacity-rules";
import {
  formatExperienceMonths,
  minimumExperienceMonths,
  workerExperienceMonths,
} from "@/lib/experience";
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
  BookingRequestDetails,
  BookingWorkerAssignmentRecord,
  CompensationType,
  DashboardMetric,
  FeaturedStatus,
  Hire,
  HireWorkerAssignmentRecord,
  AdminPaymentVerification,
  PaymentInstructions,
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
  WorkerCapacitySettings,
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
const bookingStatuses = [
  "pending",
  "confirmed",
  "payment_pending",
  "paid",
  "expired",
  "cancelled",
] as const;
const paymentStatuses = ["not_due", "deposit_due", "deposit_paid", "paid"] as const;
const hireStatuses = ["active", "completed"] as const;

function getReadableSupabaseClient() {
  return createSupabaseServiceClient() ?? createSupabaseServerClient();
}

function parseCapacitySettingValue(value: unknown) {
  if (typeof value === "number") {
    return normalizeWorkerCapacityLimit(value);
  }

  if (typeof value === "string") {
    return normalizeWorkerCapacityLimit(value);
  }

  if (isRecord(value)) {
    return normalizeWorkerCapacityLimit(value.limit);
  }

  return DEFAULT_MAX_ACTIVE_BOOKINGS_PER_WORKER;
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
  experience_months?: number | null;
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
        "experience_months",
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
    bookingWorkersResult,
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
    supabase
      .from("booking_workers")
      .select("booking_id, worker_id")
      .in("worker_id", workerIds),
  ]);
  const bookingWorkerRows =
    (bookingWorkersResult.data ?? []) as SupabaseBookingWorkerRow[];
  const bookingIdsForWorkers = Array.from(
    new Set(bookingWorkerRows.map((item) => item.booking_id)),
  );
  const { data: activeBookingRows } =
    bookingIdsForWorkers.length > 0
      ? await supabase
          .from("bookings")
          .select("id, status, payment_lock_expires_at")
          .in("id", bookingIdsForWorkers)
          .in("status", ["payment_pending", "paid"])
      : { data: [] };
  const activeBookingIds = new Set(
    ((activeBookingRows ?? []) as Array<{
      id: string;
      status: string | null;
      payment_lock_expires_at?: string | null;
    }>)
      .filter(
        (booking) =>
          isActiveBookingStatus(booking.status ?? "") &&
          (booking.status === "paid" ||
            new Date(booking.payment_lock_expires_at ?? 0).getTime() >
              Date.now()),
      )
      .map((booking) => booking.id),
  );
  const activeBookingCountsByWorker = new Map<string, number>();

  bookingWorkerRows.forEach((item) => {
    if (!activeBookingIds.has(item.booking_id)) {
      return;
    }

    activeBookingCountsByWorker.set(
      item.worker_id,
      (activeBookingCountsByWorker.get(item.worker_id) ?? 0) + 1,
    );
  });

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
      experience_months: workerExperienceMonths({
        experience_months: worker.experience_months,
        years_of_experience: Math.max(Number(worker.years_of_experience) || 0, 0),
      }),
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
      active_booking_count: activeBookingCountsByWorker.get(worker.id) ?? 0,
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
      min_experience_months: minimumExperienceMonths(role),
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

function getActiveBookingCountForWorker(workerId: string) {
  return bookings.filter(
    (booking) =>
      bookingLocksWorkers(booking.status) && booking.worker_ids.includes(workerId),
  ).length;
}

function hydrateWorker(id: string): Worker | undefined {
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
    experience_months: workerExperienceMonths(worker),
    skills: relatedSkills,
    portfolio: portfolioImages.filter((item) => item.worker_id === id),
    verification_documents: verificationDocuments.filter(
      (item) => item.worker_id === id,
    ),
    reference_contacts: workerReferences.filter((item) => item.worker_id === id),
    internal_notes: adminNotes.filter((item) => item.worker_id === id),
    active_assignment: getActiveAssignmentForWorker(id),
    active_booking_count: getActiveBookingCountForWorker(id),
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
          min_experience_months: minimumExperienceMonths(requestRole),
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

      if (workerExperienceMonths(worker) < minimumExperienceMonths(roleRequest)) {
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
        formatExperienceMonths(workerExperienceMonths(worker)),
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
          Math.max(
            workerExperienceMonths(worker) - minimumExperienceMonths(roleRequest),
            0,
          ) /
            12 *
            5 +
          20,
        reasons,
        matched_specialties: matchedSpecialties,
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function getWorkers(): Worker[] {
  return workers
    .map((worker) => hydrateWorker(worker.id))
    .filter((worker): worker is Worker => Boolean(worker))
    .sort((left, right) => {
      if (left.verification_status === right.verification_status) {
        return workerExperienceMonths(right) - workerExperienceMonths(left);
      }

      if (left.verification_status === "verified") {
        return -1;
      }

      if (right.verification_status === "verified") {
        return 1;
      }

      return workerExperienceMonths(right) - workerExperienceMonths(left);
    });
}

export async function getWorkersAsync(): Promise<Worker[]> {
  return mergeById(await getWorkersFromSupabase(), getWorkers());
}

export async function getWorkerCapacitySettingsAsync(): Promise<WorkerCapacitySettings> {
  const supabase = getReadableSupabaseClient();

  if (!supabase) {
    return {
      max_active_bookings_per_worker: DEFAULT_MAX_ACTIVE_BOOKINGS_PER_WORKER,
    };
  }

  const { data, error } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", WORKER_CAPACITY_SETTING_KEY)
    .maybeSingle();

  if (error || !data) {
    return {
      max_active_bookings_per_worker: DEFAULT_MAX_ACTIVE_BOOKINGS_PER_WORKER,
    };
  }

  return {
    max_active_bookings_per_worker: parseCapacitySettingValue(
      (data as { value?: unknown }).value,
    ),
  };
}

export function getPublicWorkers() {
  return getWorkers().filter(
    (worker) =>
      worker.verification_status === "verified" &&
      worker.listed_publicly &&
      worker.availability_status === "available",
  );
}

export async function getPublicWorkersAsync() {
  return (await getWorkersAsync()).filter(
    (worker) =>
      worker.verification_status === "verified" &&
      worker.listed_publicly &&
      worker.availability_status === "available",
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

  return worker.verification_status === "verified" &&
    worker.listed_publicly &&
    worker.availability_status === "available"
    ? worker
    : undefined;
}

export async function getPublicWorkerByIdAsync(id: string) {
  const worker = await getWorkerByIdAsync(id);

  if (!worker) {
    return undefined;
  }

  return worker.verification_status === "verified" &&
    worker.listed_publicly &&
    worker.availability_status === "available"
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

type SupabaseTeamRequestRow = {
  id: string;
  user_id?: string | null;
  salon_name: string;
  contact_name: string;
  contact_email: string;
  contact_whatsapp: string;
  location: string;
  verified_only: boolean | null;
  work_type: string | null;
  urgency: string | null;
  status: string | null;
  notes: string | null;
  target_start_date: string;
  submitted_at: string;
};

type SupabaseTeamRequestRoleRow = {
  id: string;
  team_request_id: string;
  role: string;
  quantity: number | null;
  min_experience: number | null;
  min_experience_months?: number | null;
};

type SupabaseBookingRow = {
  id: string;
  user_id?: string | null;
  tracking_token: string | null;
  type: string | null;
  title: string;
  status: string | null;
  payment_status: string | null;
  booking_date: string;
  submitted_at: string;
  team_request_id: string | null;
  notes: string | null;
  request_details: unknown;
  payment_instructions: unknown;
  payment_lock_id?: string | null;
  payment_started_at?: string | null;
  payment_lock_expires_at?: string | null;
  payment_completed_at?: string | null;
};

type SupabaseBookingWorkerRow = {
  booking_id: string;
  worker_id: string;
  compensation_type?: string | null;
  salary_expectation?: string | null;
  commission_percentage?: number | string | null;
};

type SupabasePaymentVerificationRow = {
  booking_id: string;
  status: string | null;
  submitted_reference: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
};

type SupabaseHireRow = {
  id: string;
  user_id?: string | null;
  booking_id: string;
  title: string;
  status: string | null;
  payment_status: string | null;
  hire_date: string;
  payment_reference: string | null;
  created_at: string;
};

type SupabaseHireWorkerRow = {
  hire_id: string;
  worker_id: string;
  compensation_type?: string | null;
  salary_expectation?: string | null;
  commission_percentage?: number | string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseRequestDetails(value: unknown): BookingRequestDetails {
  return isRecord(value) ? (value as BookingRequestDetails) : {};
}

function parsePaymentInstructions(value: unknown): PaymentInstructions | null {
  return isRecord(value) ? (value as unknown as PaymentInstructions) : null;
}

function parsePaymentVerification(
  value: SupabasePaymentVerificationRow | undefined,
): AdminPaymentVerification | null {
  if (!value) {
    return null;
  }

  return {
    status: pickEnumValue(
      value.status,
      ["not_submitted", "submitted", "verified", "rejected"] as const,
      "not_submitted",
    ),
    submitted_reference: value.submitted_reference,
    verified_by: value.verified_by,
    verified_at: value.verified_at,
    notes: value.notes ?? "",
  };
}

function parseCompensationType(value: unknown): CompensationType {
  return value === "commission" ? "commission" : "monthly";
}

function defaultBookingWorkerAssignment(
  bookingId: string,
  workerId: string,
  worker?: Worker,
): BookingWorkerAssignmentRecord {
  const compensationType = worker ? defaultCompensationType(worker) : "monthly";

  return {
    booking_id: bookingId,
    worker_id: workerId,
    compensation_type: compensationType,
    salary_expectation:
      compensationType === "monthly" && worker
        ? defaultSalaryExpectation(worker)
        : "",
    commission_percentage:
      compensationType === "commission" && worker
        ? defaultCommissionPercentage(worker)
        : null,
  };
}

function normalizeBookingWorkerAssignment(
  row: SupabaseBookingWorkerRow,
  worker?: Worker,
): BookingWorkerAssignmentRecord {
  const fallback = defaultBookingWorkerAssignment(
    row.booking_id,
    row.worker_id,
    worker,
  );
  const compensationType = parseCompensationType(
    row.compensation_type ?? fallback.compensation_type,
  );

  return {
    booking_id: row.booking_id,
    worker_id: row.worker_id,
    compensation_type: compensationType,
    salary_expectation:
      compensationType === "monthly"
        ? cleanString(row.salary_expectation) || fallback.salary_expectation
        : "",
    commission_percentage:
      compensationType === "commission"
        ? normalizeCommissionPercentage(
            row.commission_percentage ?? fallback.commission_percentage,
          )
        : null,
  };
}

function normalizeHireWorkerAssignment(
  row: SupabaseHireWorkerRow,
  fallback?: BookingWorkerAssignmentRecord,
  worker?: Worker,
): HireWorkerAssignmentRecord {
  const fallbackBookingAssignment =
    fallback ?? defaultBookingWorkerAssignment("", row.worker_id, worker);
  const compensationType = parseCompensationType(
    row.compensation_type ?? fallbackBookingAssignment.compensation_type,
  );

  return {
    hire_id: row.hire_id,
    worker_id: row.worker_id,
    compensation_type: compensationType,
    salary_expectation:
      compensationType === "monthly"
        ? cleanString(row.salary_expectation) ||
          fallbackBookingAssignment.salary_expectation
        : "",
    commission_percentage:
      compensationType === "commission"
        ? normalizeCommissionPercentage(
            row.commission_percentage ??
              fallbackBookingAssignment.commission_percentage,
          )
        : null,
  };
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function expireStalePaymentLocks() {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  try {
    await supabase.rpc("expire_stale_payment_locks");
  } catch {
    // The migration may not be applied in local preview environments yet.
  }
}

async function getTeamRequestsFromSupabase(
  requestIds?: string[],
): Promise<TeamRequest[]> {
  const supabase = getReadableSupabaseClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("team_requests")
    .select(
      [
        "id",
        "user_id",
        "salon_name",
        "contact_name",
        "contact_email",
        "contact_whatsapp",
        "location",
        "verified_only",
        "work_type",
        "urgency",
        "status",
        "notes",
        "target_start_date",
        "submitted_at",
      ].join(", "),
    )
    .order("submitted_at", { ascending: false });

  if (requestIds?.length) {
    query = query.in("id", requestIds);
  }

  const { data: requestRows, error } = await query;
  const dbRequestRows = (requestRows ?? []) as unknown as SupabaseTeamRequestRow[];

  if (error || dbRequestRows.length === 0) {
    return [];
  }

  const ids = dbRequestRows.map((request) => request.id);
  const [{ data: roleRows }, { data: specialtyRows }, allSkills] =
    await Promise.all([
      supabase
        .from("team_request_roles")
        .select("id, team_request_id, role, quantity, min_experience, min_experience_months")
        .in("team_request_id", ids),
      supabase
        .from("team_request_role_specialties")
        .select("id, team_request_role_id, skill_id"),
      getSkillsAsync(),
    ]);
  const skillsById = new Map(allSkills.map((skill) => [skill.id, skill]));
  const specialtiesByRole = new Map<string, SkillRecord[]>();

  (
    (specialtyRows ?? []) as unknown as Array<{
      id: string;
      team_request_role_id: string;
      skill_id: string;
    }>
  ).forEach((specialty) => {
    const skill = skillsById.get(specialty.skill_id);

    if (!skill) {
      return;
    }

    specialtiesByRole.set(specialty.team_request_role_id, [
      ...(specialtiesByRole.get(specialty.team_request_role_id) ?? []),
      skill,
    ]);
  });

  const rolesByRequest = new Map<string, TeamRequestRole[]>();

  ((roleRows ?? []) as unknown as SupabaseTeamRequestRoleRow[]).forEach((role) => {
    const hydratedRole: TeamRequestRole = {
      id: role.id,
      team_request_id: role.team_request_id,
      role: role.role,
      quantity: Math.max(Number(role.quantity) || 0, 0),
      min_experience: Math.max(Number(role.min_experience) || 0, 0),
      min_experience_months: minimumExperienceMonths({
        min_experience: Math.max(Number(role.min_experience) || 0, 0),
        min_experience_months: role.min_experience_months,
      }),
      specialties: specialtiesByRole.get(role.id) ?? [],
    };

    rolesByRequest.set(role.team_request_id, [
      ...(rolesByRequest.get(role.team_request_id) ?? []),
      hydratedRole,
    ]);
  });

  return dbRequestRows.map((request) => {
    const requestedRoles = rolesByRequest.get(request.id) ?? [];

    return {
      id: request.id,
      user_id: request.user_id ?? null,
      salon_name: request.salon_name,
      contact_name: request.contact_name,
      contact_email: request.contact_email,
      contact_whatsapp: request.contact_whatsapp,
      location: request.location,
      verified_only: Boolean(request.verified_only),
      work_type: pickEnumValue(
        request.work_type,
        ["long-term-contract", "short-term-contract"] as const,
        "long-term-contract",
      ),
      urgency: pickEnumValue(
        request.urgency,
        ["standard", "priority", "urgent"] as const,
        "priority",
      ),
      status: pickEnumValue(
        request.status,
        ["new", "reviewing", "staffing", "completed"] as const,
        "new",
      ),
      notes: request.notes ?? "",
      target_start_date: request.target_start_date,
      submitted_at: request.submitted_at,
      requested_roles: requestedRoles,
      staffing_assignments: [],
      internal_notes: [],
      role_recommendations: [],
      filled_headcount: 0,
      open_headcount: totalHeadcount(requestedRoles),
    };
  });
}

function hydrateBookingFromSupabase(
  record: BookingRecord,
  workersById: Map<string, Worker>,
  teamRequestsById: Map<string, TeamRequest>,
): Booking {
  const hydratedWorkers = record.worker_ids
    .map((workerId) => workersById.get(workerId))
    .filter((worker): worker is Worker => Boolean(worker));
  const assignmentRecords =
    record.worker_assignments?.length
      ? record.worker_assignments
      : record.worker_ids.map((workerId) =>
          defaultBookingWorkerAssignment(
            record.id,
            workerId,
            workersById.get(workerId),
          ),
        );
  const hydratedAssignments = assignmentRecords
    .map((assignment) => {
      const worker = workersById.get(assignment.worker_id);

      return worker ? { ...assignment, worker } : null;
    })
    .filter((assignment): assignment is Booking["worker_assignments"][number] =>
      Boolean(assignment),
    );

  return {
    ...record,
    payment_instructions:
      record.payment_instructions ??
      (record.status === "confirmed" || record.status === "payment_pending"
        ? defaultPaymentInstructions({
            id: record.id,
            type: record.type,
            worker_count: hydratedWorkers.length || record.worker_ids.length,
          })
        : null),
    workers: hydratedWorkers,
    worker_assignments: hydratedAssignments,
    team_request: record.team_request_id
      ? teamRequestsById.get(record.team_request_id) ?? null
      : null,
    worker_count: hydratedWorkers.length,
  };
}

async function getBookingsFromSupabase(options?: {
  bookingId?: string;
  userId?: string;
}): Promise<Booking[]> {
  const supabase = getReadableSupabaseClient();

  if (!supabase) {
    return [];
  }

  await expireStalePaymentLocks();

  let query = supabase
    .from("bookings")
    .select(
      [
        "id",
        "user_id",
        "tracking_token",
        "type",
        "title",
        "status",
        "payment_status",
        "booking_date",
        "submitted_at",
        "team_request_id",
        "notes",
        "request_details",
        "payment_instructions",
        "payment_lock_id",
        "payment_started_at",
        "payment_lock_expires_at",
        "payment_completed_at",
      ].join(", "),
    )
    .order("submitted_at", { ascending: false });

  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }

  if (options?.bookingId) {
    query = query.eq("id", options.bookingId);
  }

  const { data: bookingRows, error } = await query;
  const dbBookingRows = (bookingRows ?? []) as unknown as SupabaseBookingRow[];

  if (error || dbBookingRows.length === 0) {
    return [];
  }

  const activeRows = dbBookingRows.filter((booking) =>
    bookingIsActive(
      pickEnumValue(booking.status, bookingStatuses, "pending"),
    ),
  );

  if (activeRows.length === 0) {
    return [];
  }

  const bookingIds = activeRows.map((booking) => booking.id);
  const teamRequestIds = Array.from(
    new Set(activeRows.map((booking) => booking.team_request_id).filter(Boolean)),
  ) as string[];
  const [
    bookingWorkersResult,
    paymentVerificationsResult,
    allWorkers,
    teamRequestsFromDb,
  ] = await Promise.all([
    supabase
      .from("booking_workers")
      .select(
        [
          "booking_id",
          "worker_id",
          "compensation_type",
          "salary_expectation",
          "commission_percentage",
        ].join(", "),
      )
      .in("booking_id", bookingIds),
    supabase
      .from("payment_verifications")
      .select(
        "booking_id, status, submitted_reference, verified_by, verified_at, notes",
      )
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false }),
    getWorkersAsync(),
    teamRequestIds.length ? getTeamRequestsFromSupabase(teamRequestIds) : [],
  ]);
  const workersById = new Map(allWorkers.map((worker) => [worker.id, worker]));
  const teamRequestsById = new Map(
    [
      ...teamRequestsFromDb,
      ...getTeamRequests().filter((request) => teamRequestIds.includes(request.id)),
    ].map((request) => [request.id, request]),
  );
  const workerIdsByBooking = new Map<string, string[]>();
  const bookingWorkerRows =
    (bookingWorkersResult.data ?? []) as unknown as SupabaseBookingWorkerRow[];

  bookingWorkerRows.forEach((item) => {
    workerIdsByBooking.set(item.booking_id, [
      ...(workerIdsByBooking.get(item.booking_id) ?? []),
      item.worker_id,
    ]);
  });

  const paymentVerificationByBooking = new Map<
    string,
    SupabasePaymentVerificationRow
  >();

  (
    (paymentVerificationsResult.data ?? []) as SupabasePaymentVerificationRow[]
  ).forEach((item) => {
    if (!paymentVerificationByBooking.has(item.booking_id)) {
      paymentVerificationByBooking.set(item.booking_id, item);
    }
  });

  return activeRows.map((booking) => {
    const record: BookingRecord = {
      id: booking.id,
      user_id: booking.user_id ?? null,
      tracking_token: booking.tracking_token,
      type: pickEnumValue(booking.type, ["worker", "team"] as const, "worker"),
      title: booking.title,
      status: pickEnumValue(booking.status, bookingStatuses, "pending"),
      payment_status: pickEnumValue(
        booking.payment_status,
        paymentStatuses,
        "not_due",
      ),
      booking_date: booking.booking_date,
      submitted_at: booking.submitted_at,
      worker_ids: workerIdsByBooking.get(booking.id) ?? [],
      worker_assignments: bookingWorkerRows
        .filter((item) => item.booking_id === booking.id)
        .map((item) =>
          normalizeBookingWorkerAssignment(
            item,
            workersById.get(item.worker_id),
          ),
        ),
      team_request_id: booking.team_request_id,
      notes: booking.notes ?? "",
      request_details: parseRequestDetails(booking.request_details),
      payment_instructions: parsePaymentInstructions(booking.payment_instructions),
      payment_verification: parsePaymentVerification(
        paymentVerificationByBooking.get(booking.id),
      ),
      payment_lock_id: booking.payment_lock_id ?? null,
      payment_started_at: booking.payment_started_at ?? null,
      payment_lock_expires_at: booking.payment_lock_expires_at ?? null,
      payment_completed_at: booking.payment_completed_at ?? null,
    };

    return hydrateBookingFromSupabase(record, workersById, teamRequestsById);
  });
}

function hydrateBooking(record: BookingRecord): Booking {
  const hydratedWorkers = record.worker_ids
    .map((workerId) => hydrateWorker(workerId))
    .filter((worker): worker is Worker => Boolean(worker));
  const workersById = new Map(hydratedWorkers.map((worker) => [worker.id, worker]));
  const assignmentRecords =
    record.worker_assignments?.length
      ? record.worker_assignments
      : record.worker_ids.map((workerId) =>
          defaultBookingWorkerAssignment(
            record.id,
            workerId,
            workersById.get(workerId),
          ),
        );
  const hydratedAssignments = assignmentRecords
    .map((assignment) => {
      const worker = workersById.get(assignment.worker_id);

      return worker ? { ...assignment, worker } : null;
    })
    .filter((assignment): assignment is Booking["worker_assignments"][number] =>
      Boolean(assignment),
    );

  return {
    ...record,
    payment_instructions:
      record.payment_instructions ??
      (record.status === "confirmed" || record.status === "payment_pending"
        ? defaultPaymentInstructions({
            id: record.id,
            type: record.type,
            worker_count: hydratedWorkers.length || record.worker_ids.length,
          })
        : null),
    workers: hydratedWorkers,
    worker_assignments: hydratedAssignments,
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

export async function getBookingsAsync() {
  return mergeById(await getBookingsFromSupabase(), getBookings());
}

export function getBookingById(id: string) {
  return getBookings().find((booking) => booking.id === id);
}

export async function getBookingByIdAsync(id: string) {
  return (await getBookingsAsync()).find((booking) => booking.id === id);
}

export async function getUserBookings(userId: string) {
  return getBookingsFromSupabase({ userId });
}

export async function getUserBookingById(id: string, userId: string) {
  return (await getBookingsFromSupabase({ bookingId: id, userId })).find(
    (booking) => booking.id === id,
  );
}

export function getHires(): Hire[] {
  return hires
    .map((hire) => {
      const hydratedWorkers = hire.worker_ids
        .map((workerId) => hydrateWorker(workerId))
        .filter((worker): worker is Worker => Boolean(worker));
      const sourceBooking = bookings.find((booking) => booking.id === hire.booking_id);
      const hydratedBooking = sourceBooking ? hydrateBooking(sourceBooking) : null;
      const sourceAssignmentsByWorker = new Map(
        hydratedBooking?.worker_assignments.map((assignment) => [
          assignment.worker_id,
          assignment,
        ]) ?? [],
      );
      const workerAssignments = hydratedWorkers.map((worker) => {
        const sourceAssignment = sourceAssignmentsByWorker.get(worker.id);
        const record =
          hire.worker_assignments?.find(
            (assignment) => assignment.worker_id === worker.id,
          ) ??
          (sourceAssignment
            ? {
                hire_id: hire.id,
                worker_id: worker.id,
                compensation_type: sourceAssignment.compensation_type,
                salary_expectation: sourceAssignment.salary_expectation,
                commission_percentage: sourceAssignment.commission_percentage,
              }
            : {
                ...defaultBookingWorkerAssignment("", worker.id, worker),
                hire_id: hire.id,
              });

        return {
          ...record,
          worker,
        };
      });

      return {
        ...hire,
        booking: hydratedBooking,
        workers: hydratedWorkers,
        worker_assignments: workerAssignments,
        worker_count: hydratedWorkers.length,
      };
    })
    .sort(
      (left, right) =>
        new Date(right.hire_date).getTime() - new Date(left.hire_date).getTime(),
    );
}

async function getHiresFromSupabase(options?: {
  hireId?: string;
  userId?: string;
}): Promise<Hire[]> {
  const supabase = getReadableSupabaseClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("hires")
    .select(
      [
        "id",
        "user_id",
        "booking_id",
        "title",
        "status",
        "payment_status",
        "hire_date",
        "payment_reference",
        "created_at",
      ].join(", "),
    )
    .order("created_at", { ascending: false });

  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }

  if (options?.hireId) {
    query = query.eq("id", options.hireId);
  }

  const { data: hireRows, error } = await query;
  const rows = (hireRows ?? []) as unknown as SupabaseHireRow[];

  if (error || rows.length === 0) {
    return [];
  }

  const hireIds = rows.map((hire) => hire.id);
  const bookingIds = rows.map((hire) => hire.booking_id);
  const [hireWorkersResult, bookingsFromDb, allWorkers] = await Promise.all([
    supabase
      .from("hire_workers")
      .select(
        [
          "hire_id",
          "worker_id",
          "compensation_type",
          "salary_expectation",
          "commission_percentage",
        ].join(", "),
      )
      .in("hire_id", hireIds),
    Promise.all(
      bookingIds.map((bookingId) =>
        getBookingsFromSupabase({
          bookingId,
          userId: options?.userId,
        }),
      ),
    ).then((items) => items.flat()),
    getWorkersAsync(),
  ]);
  const bookingsById = new Map(bookingsFromDb.map((booking) => [booking.id, booking]));
  const workersById = new Map(allWorkers.map((worker) => [worker.id, worker]));
  const workerIdsByHire = new Map<string, string[]>();
  const hireWorkerRows =
    (hireWorkersResult.data ?? []) as unknown as SupabaseHireWorkerRow[];

  hireWorkerRows.forEach((item) => {
    workerIdsByHire.set(item.hire_id, [
      ...(workerIdsByHire.get(item.hire_id) ?? []),
      item.worker_id,
    ]);
  });

  return rows
    .map((hire) => {
      const sourceBooking = bookingsById.get(hire.booking_id) ?? null;
      const workerIds =
        workerIdsByHire.get(hire.id) ?? sourceBooking?.worker_ids ?? [];
      const hydratedWorkers = workerIds
        .map((workerId) => workersById.get(workerId))
        .filter((worker): worker is Worker => Boolean(worker));
      const bookingAssignmentsByWorker = new Map(
        sourceBooking?.worker_assignments.map((assignment) => [
          assignment.worker_id,
          assignment,
        ]) ?? [],
      );
      const rowAssignments = hireWorkerRows.filter((item) => item.hire_id === hire.id);
      const workerAssignments = hydratedWorkers.map((worker) => {
        const row = rowAssignments.find((item) => item.worker_id === worker.id);
        const fallback = bookingAssignmentsByWorker.get(worker.id);
        const record = row
          ? normalizeHireWorkerAssignment(row, fallback, worker)
          : {
              hire_id: hire.id,
              worker_id: worker.id,
              compensation_type:
                fallback?.compensation_type ?? defaultCompensationType(worker),
              salary_expectation:
                fallback?.salary_expectation ?? defaultSalaryExpectation(worker),
              commission_percentage:
                fallback?.commission_percentage ??
                defaultCommissionPercentage(worker),
            };

        return {
          ...record,
          worker,
        };
      });

      return {
        id: hire.id,
        user_id: hire.user_id ?? sourceBooking?.user_id ?? null,
        booking_id: hire.booking_id,
        title: hire.title,
        status: pickEnumValue(hire.status, hireStatuses, "active"),
        payment_status: pickEnumValue(
          hire.payment_status,
          paymentStatuses,
          "paid",
        ),
        hire_date: hire.hire_date,
        worker_ids: workerIds,
        payment_reference: hire.payment_reference ?? "Verified manually",
        booking: sourceBooking,
        workers: hydratedWorkers,
        worker_assignments: workerAssignments,
        worker_count: hydratedWorkers.length,
      } satisfies Hire;
    })
    .sort(
      (left, right) =>
        new Date(right.hire_date).getTime() - new Date(left.hire_date).getTime(),
    );
}

export async function getHiresAsync() {
  return mergeById(await getHiresFromSupabase(), getHires());
}

export function getHireById(id: string) {
  return getHires().find((hire) => hire.id === id);
}

export async function getHireByIdAsync(id: string) {
  return (await getHiresAsync()).find((hire) => hire.id === id);
}

export async function getUserHires(userId: string) {
  return getHiresFromSupabase({ userId });
}

export async function getUserHireById(id: string, userId: string) {
  return (await getHiresFromSupabase({ hireId: id, userId })).find(
    (hire) => hire.id === id,
  );
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
      label: "Payment locks",
      value: String(
        hydratedWorkers.filter((worker) => worker.availability_status === "reserved").length,
      ),
      detail: "Workers temporarily locked after clients start deposit payment.",
    },
  ];
}

export async function getDashboardMetricsAsync(): Promise<DashboardMetric[]> {
  const [hydratedWorkers, hydratedBookings] = await Promise.all([
    getWorkersAsync(),
    getBookingsAsync(),
  ]);

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
      label: "Payment locks",
      value: String(
        hydratedWorkers.filter((worker) => worker.availability_status === "reserved")
          .length,
      ),
      detail: "Workers temporarily locked after clients start deposit payment.",
    },
  ];
}
