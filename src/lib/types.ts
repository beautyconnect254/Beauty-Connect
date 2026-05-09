export type WorkerRole =
  | "Hair Stylist"
  | "Barber"
  | "Nail Technician"
  | "Makeup Artist"
  | "Spa Therapist"
  | "Lash Technician"
  | "Braider"
  | "Wig Specialist";

export type AvailabilityStatus =
  | "available"
  | "reserved"
  | "hired"
  | "unavailable";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type WorkType = "full-time" | "part-time" | "contract" | "freelance";

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

export interface WorkerRecord {
  id: string;
  full_name: string;
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
  work_type: WorkType;
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

export interface WorkerCategory {
  role: WorkerRole;
  description: string;
  typical_team_use: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
}
