export const ADMIN_ACCESS_TOKEN_COOKIE = "bc-admin-access-token";

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidAdminEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
