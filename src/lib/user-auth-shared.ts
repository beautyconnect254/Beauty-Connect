export const USER_ACCESS_TOKEN_COOKIE = "bc-user-access-token";
export const AUTH_INTENT_STORAGE_KEY = "bc-auth-intent";
export const AUTH_INTENT_EVENT = "beautyconnect:auth-intent";
export const AUTH_CALLBACK_PATH = "/auth/callback";
export const AUTH_CALLBACK_NEXT_PARAM = "next";

export type AuthIntent =
  | {
      type: "navigate";
      href: string;
      title?: string;
      description?: string;
    }
  | {
      type: "worker-request";
      workerId: string;
      title?: string;
      description?: string;
    };

export function normalizeUserEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidUserEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeUserEmail(email));
}
