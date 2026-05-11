export const ADMIN_ACCESS_TOKEN_COOKIE = "bc-admin-access-token";

export interface AdminWhitelistRecord {
  email: string;
  active: boolean;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidAdminEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
