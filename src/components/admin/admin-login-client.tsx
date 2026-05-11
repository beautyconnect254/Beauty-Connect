"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isValidAdminEmail, normalizeAdminEmail } from "@/lib/admin-auth-shared";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type LoginPhase = "checking" | "idle" | "sending" | "sent" | "error";

async function readError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return body?.error || "Something went wrong. Please try again.";
}

export function AdminLoginClient() {
  const router = useRouter();
  const syncStartedRef = useRef(false);
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<LoginPhase>(
    isSupabaseConfigured ? "checking" : "error",
  );
  const [notice, setNotice] = useState(
    isSupabaseConfigured
      ? "Checking admin session..."
      : "Supabase is not configured for admin login.",
  );

  const syncSession = useCallback(
    async (session: Session | null) => {
      if (!session?.access_token || syncStartedRef.current) {
        return;
      }

      syncStartedRef.current = true;
      setPhase("checking");
      setNotice("Opening admin workspace...");

      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken: session.access_token }),
      });

      if (!response.ok) {
        const error = await readError(response);
        const supabase = createSupabaseBrowserClient();
        await supabase?.auth.signOut();
        syncStartedRef.current = false;
        setPhase("error");
        setNotice(error);
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    },
    [router],
  );

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const authClient = supabase;
    let active = true;

    async function loadSession() {
      const { data } = await authClient.auth.getSession();

      if (!active) {
        return;
      }

      if (data.session) {
        await syncSession(data.session);
        return;
      }

      setPhase("idle");
      setNotice("Send yourself a magic link to continue.");
    }

    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((_event, session) => {
      if (session) {
        void syncSession(session);
      }
    });

    void loadSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [syncSession]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = normalizeAdminEmail(email);

    if (!isValidAdminEmail(normalizedEmail)) {
      setPhase("error");
      setNotice("Enter a valid admin email address.");
      return;
    }

    setPhase("sending");
    setNotice("Sending magic link...");

    const response = await fetch("/api/admin/magic-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    if (!response.ok) {
      setPhase("error");
      setNotice(await readError(response));
      return;
    }

    setPhase("sent");
    setNotice(`Magic link sent to ${normalizedEmail}.`);
  }

  const waiting = phase === "checking" || phase === "sending";
  const sent = phase === "sent";

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-3 border-b border-[color:var(--border)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[color:var(--foreground)] text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>Admin Access</CardTitle>
          <CardDescription>
            Use the whitelisted email for Beauty Connect staffing ops.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block space-y-1.5">
            <span className="text-xs font-extrabold uppercase text-[color:var(--muted-foreground)]">
              Admin email
            </span>
            <Input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              type="email"
              value={email}
            />
          </label>

          <Button className="w-full" disabled={waiting} type="submit">
            {waiting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : sent ? (
              <Mail className="h-4 w-4" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {sent ? "Send Again" : "Send Magic Link"}
          </Button>
        </form>

        <div
          className={
            phase === "error"
              ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
              : "rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]"
          }
        >
          <div className="flex items-start gap-2">
            {phase === "sent" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            ) : waiting ? (
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{notice}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
