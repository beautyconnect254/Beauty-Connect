"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";

import { AuthModal } from "@/components/auth/auth-modal";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import {
  AUTH_INTENT_EVENT,
  AUTH_INTENT_STORAGE_KEY,
  type AuthIntent,
} from "@/lib/user-auth-shared";

interface RequireAuthOptions {
  intent: AuthIntent;
  onAuthenticated?: () => void;
}

interface AuthContextValue {
  clearPendingIntent: () => void;
  getAccessToken: () => string | null;
  loading: boolean;
  openAuthModal: (intent?: AuthIntent) => void;
  pendingIntent: AuthIntent | null;
  requireAuth: (options: RequireAuthOptions) => boolean;
  session: Session | null;
  signOut: () => Promise<void>;
  user: User | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredIntent(): AuthIntent | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(AUTH_INTENT_STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as AuthIntent;

    if (parsed.type === "navigate" && parsed.href) {
      return parsed;
    }

    if (parsed.type === "worker-request" && parsed.workerId) {
      return parsed;
    }
  } catch {
    window.localStorage.removeItem(AUTH_INTENT_STORAGE_KEY);
  }

  return null;
}

function writeStoredIntent(intent: AuthIntent | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!intent) {
    window.localStorage.removeItem(AUTH_INTENT_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_INTENT_STORAGE_KEY, JSON.stringify(intent));
}

function defaultTitle(intent: AuthIntent | null) {
  if (intent?.title) {
    return intent.title;
  }

  if (intent?.type === "worker-request") {
    return "Sign in to request this worker";
  }

  if (intent?.type === "navigate" && intent.href.startsWith("/hires")) {
    return "Sign in to view hires";
  }

  if (intent?.type === "navigate" && intent.href.startsWith("/bookings")) {
    return "Sign in to view bookings";
  }

  if (intent?.type === "navigate" && intent.href.startsWith("/team-builder")) {
    return "Sign in to build your team";
  }

  return "Login / Sign Up";
}

function defaultDescription(intent: AuthIntent | null) {
  if (intent?.description) {
    return intent.description;
  }

  return "Use Google or an email magic link. Your bookings and hires will stay linked to your account.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const completingIntentRef = useRef(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<AuthIntent | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const clearPendingIntent = useCallback(() => {
    writeStoredIntent(null);
    setPendingIntent(null);
    completingIntentRef.current = false;
  }, []);

  const savePendingIntent = useCallback((intent: AuthIntent) => {
    writeStoredIntent(intent);
    setPendingIntent(intent);
  }, []);

  const syncSession = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.access_token) {
      await fetch("/api/auth/session", { method: "DELETE" }).catch(() => null);
      return;
    }

    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accessToken: nextSession.access_token }),
    });

    if (!response.ok) {
      throw new Error("Could not sync your sign-in session.");
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const authClient = supabase;
    let active = true;

    async function loadSession() {
      setLoading(true);
      const { data } = await authClient.auth.getSession();

      if (!active) {
        return;
      }

      setSession(data.session);
      setPendingIntent(readStoredIntent());

      try {
        await syncSession(data.session);
      } catch {
        setError("Your session could not be synced. Please sign in again.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setPendingIntent(readStoredIntent());

      void syncSession(nextSession)
        .then(() => {
          router.refresh();
        })
        .catch(() => {
          setError("Your session could not be synced. Please sign in again.");
        });
    });

    void loadSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, supabase, syncSession]);

  useEffect(() => {
    if (!session?.user || loading || completingIntentRef.current) {
      return;
    }

    const intent = pendingIntent ?? readStoredIntent();

    if (!intent) {
      return;
    }

    completingIntentRef.current = true;

    queueMicrotask(() => {
      setModalOpen(false);

      if (intent.type === "navigate") {
        clearPendingIntent();
        router.push(intent.href);
        router.refresh();
        return;
      }

      window.dispatchEvent(new CustomEvent(AUTH_INTENT_EVENT, { detail: intent }));
    });
  }, [clearPendingIntent, loading, pendingIntent, router, session?.user]);

  const openAuthModal = useCallback(
    (intent?: AuthIntent) => {
      setError("");
      setNotice("");

      if (intent) {
        savePendingIntent(intent);
      }

      setModalOpen(true);
    },
    [savePendingIntent],
  );

  const requireAuth = useCallback(
    ({ intent, onAuthenticated }: RequireAuthOptions) => {
      if (session?.user) {
        if (onAuthenticated) {
          onAuthenticated();
          return true;
        }

        if (intent.type === "navigate") {
          router.push(intent.href);
          return true;
        }

        return true;
      }

      openAuthModal(intent);
      return false;
    },
    [openAuthModal, router, session?.user],
  );

  const getAccessToken = useCallback(() => session?.access_token ?? null, [session]);

  const signOut = useCallback(async () => {
    clearPendingIntent();
    setModalOpen(false);
    setSession(null);
    await supabase?.auth.signOut();
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => null);
    router.refresh();
  }, [clearPendingIntent, router, supabase]);

  async function signInWithGoogle() {
    if (!supabase) {
      setError("Supabase Auth is not configured yet.");
      return;
    }

    setAuthBusy(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setAuthBusy(false);
    }
  }

  async function signInWithEmail(email: string) {
    if (!supabase) {
      setError("Supabase Auth is not configured yet.");
      return;
    }

    setAuthBusy(true);
    setError("");
    setNotice("");

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.href,
        shouldCreateUser: true,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setAuthBusy(false);
      return;
    }

    setNotice(`Magic link sent to ${email}.`);
    setAuthBusy(false);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      clearPendingIntent,
      getAccessToken,
      loading,
      openAuthModal,
      pendingIntent,
      requireAuth,
      session,
      signOut,
      user: session?.user ?? null,
    }),
    [
      clearPendingIntent,
      getAccessToken,
      loading,
      openAuthModal,
      pendingIntent,
      requireAuth,
      session,
      signOut,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        description={defaultDescription(pendingIntent)}
        emailNotice={notice}
        error={error}
        loading={authBusy}
        onClose={() => setModalOpen(false)}
        onEmailSignIn={signInWithEmail}
        onGoogleSignIn={signInWithGoogle}
        open={modalOpen}
        supabaseReady={Boolean(supabase)}
        title={defaultTitle(pendingIntent)}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
