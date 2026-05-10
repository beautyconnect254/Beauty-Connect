export type WorkerRole = string;

export type AvailabilityStatus =
  | "available"
  | "reserved"
  | "hired";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type WorkType = "full-time" | "part-time" | "contract" | "freelance";

export type TeamWorkType = "long-term-contract" | "short-term-contract";

export type VerificationDocumentStatus = "pending" | "verified" | "rejected";

export type TeamRequestStatus =
  | "new"
  | "reviewing"
  | "staffing"
  | "completed";

export type TeamRequestUrgency = "standard" | "priority" | "urgent";

export type StaffingAssignmentStatus =
  | "recommended"
  | "reserved"
  | "hired"
  | "released";

export type FeaturedStatus = "active" | "scheduled" | "expired" | "off";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "paid"
  | "cancelled";

export type BookingType = "worker" | "team";

export type PaymentStatus = "not_due" | "deposit_due" | "deposit_paid" | "paid";

export type HireStatus = "active" | "completed";

export interface WorkerRecord {
  id: string;
  full_name: string;
  id_number?: string;
  primary_role: WorkerRole;
  profile_photo: string;
  location: string;
  years_of_experience: number;
  bio: string;
  availability_status: AvailabilityStatus;
  verification_status: VerificationStatus;
  salary_expectation: number;
  work_type: WorkType;
  whatsapp_number: string;
  headline: string;
  featured: boolean;
  featured_status: FeaturedStatus;
  featured_expires_at: string | null;
  featured_frequency: number;
  featured_priority_score: number;
  listed_publicly: boolean;
}

export interface SkillRecord {
  id: string;
  name: string;
  role: WorkerRole;
}

export interface WorkerSkillRecord {
  id: string;
  worker_id: string;
  skill_id: string;
  proficiency_level: "core" | "advanced" | "specialist";
}

export interface PortfolioImageRecord {
  id: string;
  worker_id: string;
  image_url: string;
  caption: string;
  is_cover: boolean;
}

export interface WorkerReferenceRecord {
  id: string;
  worker_id: string;
  contact_name: string;
  contact_phone: string;
  relationship: string;
  previous_workplace: string;
}

export interface TeamRequestRecord {
  id: string;
  salon_name: string;
  contact_name: string;
  contact_email: string;
  contact_whatsapp: string;
  location: string;
  verified_only: boolean;
  work_type: TeamWorkType;
  urgency: TeamRequestUrgency;
  status: TeamRequestStatus;
  notes: string;
  target_start_date: string;
  submitted_at: string;
}

export interface TeamRequestRoleRecord {
  id: string;
  team_request_id: string;
  role: WorkerRole;
  quantity: number;
  min_experience: number;
}

export interface TeamRequestRoleSkillRecord {
  id: string;
  team_request_role_id: string;
  skill_id: string;
}

export interface AdminNoteRecord {
  id: string;
  worker_id: string | null;
  team_request_id: string | null;
  staffing_assignment_id: string | null;
  author: string;
  note: string;
  created_at: string;
}

export type AdminActivityType =
  | "booking_confirmed"
  | "worker_reserved"
  | "payment_confirmed"
  | "worker_released"
  | "worker_status_updated";

export interface AdminActivityLogRecord {
  id: string;
  type: AdminActivityType;
  actor: string;
  message: string;
  booking_id: string | null;
  worker_id: string | null;
  created_at: string;
}

export interface VerificationDocumentRecord {
  id: string;
  worker_id: string;
  document_type: string;
  status: VerificationDocumentStatus;
  file_url: string;
  uploaded_at: string;
}

export interface StaffingAssignmentRecord {
  id: string;
  team_request_id: string;
  team_request_role_id: string | null;
  worker_id: string;
  status: StaffingAssignmentStatus;
  assigned_by: string;
  assigned_at: string;
  notes: string;
}

export interface BookingRecord {
  id: string;
  tracking_token: string | null;
  type: BookingType;
  title: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  booking_date: string;
  submitted_at: string;
  worker_ids: string[];
  team_request_id: string | null;
  notes: string;
  request_details?: BookingRequestDetails | null;
  payment_instructions: PaymentInstructions | null;
  payment_verification: AdminPaymentVerification | null;
}

export interface HireRecord {
  id: string;
  booking_id: string;
  title: string;
  status: HireStatus;
  payment_status: PaymentStatus;
  hire_date: string;
  worker_ids: string[];
  payment_reference: string;
}

export interface BookingRequestDetails {
  client?: {
    salon_name?: string;
    contact_name?: string;
    contact_email?: string;
    contact_whatsapp?: string;
    location?: string;
  };
  requested_worker?: {
    id?: string;
    name?: string;
    role?: string;
  };
  roles?: Array<{
    role: string;
    quantity: number;
    min_experience?: number;
    experience_label?: string;
    specialty_ids?: string[];
    specialty_names?: string[];
  }>;
  work_type?: TeamWorkType;
}

export interface PaymentInstructions {
  mpesa_paybill: string;
  mpesa_account: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  deposit_amount: number;
  payment_reference: string;
  notes: string;
}

export interface AdminPaymentVerification {
  status: "not_submitted" | "submitted" | "verified" | "rejected";
  submitted_reference: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string;
}

export interface WorkerPlacementSummary {
  team_request_id: string;
  salon_name: string;
  status: StaffingAssignmentStatus;
  assigned_at: string;
}

export interface Worker extends WorkerRecord {
  skills: SkillRecord[];
  portfolio: PortfolioImageRecord[];
  verification_documents: VerificationDocumentRecord[];
  reference_contacts: WorkerReferenceRecord[];
  internal_notes: AdminNoteRecord[];
  active_assignment: WorkerPlacementSummary | null;
}

export interface TeamRequestRole extends TeamRequestRoleRecord {
  specialties: SkillRecord[];
}

export interface StaffingAssignment extends StaffingAssignmentRecord {
  worker: Worker;
  request_role: TeamRequestRole | null;
}

export interface WorkerRecommendation {
  worker: Worker;
  score: number;
  reasons: string[];
  matched_specialties: SkillRecord[];
}

export interface TeamRequestRoleRecommendation {
  role_request: TeamRequestRole;
  recommendations: WorkerRecommendation[];
}

export interface TeamRequest extends TeamRequestRecord {
  requested_roles: TeamRequestRole[];
  staffing_assignments: StaffingAssignment[];
  internal_notes: AdminNoteRecord[];
  role_recommendations: TeamRequestRoleRecommendation[];
  filled_headcount: number;
  open_headcount: number;
}

export interface Booking extends BookingRecord {
  workers: Worker[];
  team_request: TeamRequest | null;
  worker_count: number;
}

export interface Hire extends HireRecord {
  booking: Booking | null;
  workers: Worker[];
  worker_count: number;
}

export interface WorkerCategory {
  role: WorkerRole;
  description: string;
  typical_team_use: string;
}

export interface RoleSpecialtyCatalog {
  role: WorkerRole;
  description: string;
  typical_team_use: string;
  specialties: SkillRecord[];
}

export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
}
