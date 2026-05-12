"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { AUTH_CALLBACK_NEXT_PARAM } from "@/lib/user-auth-shared";

async function syncAppSession(session: Session) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ accessToken: session.access_token }),
  });

  if (!response.ok) {
    throw new Error("Could not finish signing you in.");
  }
}

function cleanNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function sessionFromHash() {
  const hash = window.location.hash.replace(/^#/, "");

  if (!hash) {
    return null;
  }

  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Completing sign in...");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function finishSignIn() {
      const supabase = createSupabaseBrowserClient();

      if (!isSupabaseConfigured || !supabase) {
        setError("Supabase Auth is not configured.");
        return;
      }

      const next = cleanNext(searchParams.get(AUTH_CALLBACK_NEXT_PARAM));
      const code = searchParams.get("code");

      try {
        let session: Session | null = null;

        if (code) {
          setMessage("Securing your Google session...");
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }

          session = data.session;
        } else {
          const hashSession = sessionFromHash();

          if (hashSession) {
            setMessage("Saving your session...");
            const { data, error: setSessionError } =
              await supabase.auth.setSession(hashSession);

            if (setSessionError) {
              throw setSessionError;
            }

            session = data.session;
          } else {
            const { data } = await supabase.auth.getSession();
            session = data.session;
          }
        }

        if (!session) {
          throw new Error("No sign-in session was returned.");
        }

        await syncAppSession(session);

        if (!active) {
          return;
        }

        setMessage("Opening your workspace...");
        router.replace(next);
        router.refresh();
      } catch (callbackError) {
        if (!active) {
          return;
        }

        setError(
          callbackError instanceof Error
            ? callbackError.message
            : "Could not finish signing you in.",
        );
      }
    }

    void finishSignIn();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-md items-center justify-center px-3 py-8">
      <div className="w-full rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[color:var(--foreground)]">
              Login / Sign Up
            </h1>
            <p className="mt-1 text-sm font-semibold leading-5 text-[color:var(--muted-foreground)]">
              {error || message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
