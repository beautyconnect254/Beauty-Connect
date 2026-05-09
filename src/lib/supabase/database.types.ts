export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      workers: {
        Row: {
          id: string;
          full_name: string;
          primary_role: string;
          profile_photo: string;
          location: string;
          years_of_experience: number;
          bio: string;
          availability_status: string;
          verification_status: string;
          salary_expectation: number;
          work_type: string;
          whatsapp_number: string;
          headline: string;
          featured: boolean;
          listed_publicly: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workers"]["Row"]> & {
          id: string;
          full_name: string;
          primary_role: string;
        };
        Update: Partial<Database["public"]["Tables"]["workers"]["Row"]>;
      };
      worker_references: {
        Row: {
          id: string;
          worker_id: string;
          contact_name: string;
          contact_phone: string;
          relationship: string;
          previous_workplace: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["worker_references"]["Row"]> & {
          id: string;
          worker_id: string;
          contact_name: string;
          contact_phone: string;
        };
        Update: Partial<Database["public"]["Tables"]["worker_references"]["Row"]>;
      };
      skills: {
        Row: {
          id: string;
          name: string;
          role: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["skills"]["Row"]> & {
          id: string;
          name: string;
          role: string;
        };
        Update: Partial<Database["public"]["Tables"]["skills"]["Row"]>;
      };
      worker_skills: {
        Row: {
          id: string;
          worker_id: string;
          skill_id: string;
          proficiency_level: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["worker_skills"]["Row"]> & {
          id: string;
          worker_id: string;
          skill_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["worker_skills"]["Row"]>;
      };
      portfolio_images: {
        Row: {
          id: string;
          worker_id: string;
          image_url: string;
          caption: string;
          is_cover: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["portfolio_images"]["Row"]> & {
          id: string;
          worker_id: string;
          image_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["portfolio_images"]["Row"]>;
      };
      team_requests: {
        Row: {
          id: string;
          salon_name: string;
          contact_name: string;
          contact_email: string;
          contact_whatsapp: string;
          location: string;
          verified_only: boolean;
          work_type: string;
          urgency: string;
          status: string;
          notes: string;
          target_start_date: string;
          submitted_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["team_requests"]["Row"]> & {
          id: string;
          salon_name: string;
          contact_name: string;
          contact_email: string;
          contact_whatsapp: string;
          location: string;
          target_start_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_requests"]["Row"]>;
      };
      team_request_roles: {
        Row: {
          id: string;
          team_request_id: string;
          role: string;
          quantity: number;
          min_experience: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["team_request_roles"]["Row"]> & {
          id: string;
          team_request_id: string;
          role: string;
          quantity: number;
        };
        Update: Partial<Database["public"]["Tables"]["team_request_roles"]["Row"]>;
      };
      team_request_role_specialties: {
        Row: {
          id: string;
          team_request_role_id: string;
          skill_id: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["team_request_role_specialties"]["Row"]
        > & {
          id: string;
          team_request_role_id: string;
          skill_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["team_request_role_specialties"]["Row"]
        >;
      };
      verification_documents: {
        Row: {
          id: string;
          worker_id: string;
          document_type: string;
          status: string;
          file_url: string;
          uploaded_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["verification_documents"]["Row"]
        > & {
          id: string;
          worker_id: string;
          document_type: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["verification_documents"]["Row"]
        >;
      };
      staffing_assignments: {
        Row: {
          id: string;
          team_request_id: string;
          team_request_role_id: string | null;
          worker_id: string;
          status: string;
          assigned_by: string;
          assigned_at: string;
          notes: string;
        };
        Insert: Partial<Database["public"]["Tables"]["staffing_assignments"]["Row"]> & {
          id: string;
          team_request_id: string;
          worker_id: string;
          assigned_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["staffing_assignments"]["Row"]>;
      };
      admin_notes: {
        Row: {
          id: string;
          worker_id: string | null;
          team_request_id: string | null;
          staffing_assignment_id: string | null;
          author: string;
          note: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admin_notes"]["Row"]> & {
          id: string;
          author: string;
          note: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_notes"]["Row"]>;
      };
    };
  };
}
