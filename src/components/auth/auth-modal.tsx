"use client";

import type { FormEvent, MouseEvent } from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, LogIn, Mail, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidUserEmail, normalizeUserEmail } from "@/lib/user-auth-shared";

interface AuthModalProps {
  open: boolean;
  title: string;
  description: string;
  emailNotice: string;
  error: string;
  loading: boolean;
  supabaseReady: boolean;
  onClose: () => void;
  onEmailSignIn: (email: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
}

export function AuthModal({
  open,
  title,
  description,
  emailNotice,
  error,
  loading,
  supabaseReady,
  onClose,
  onEmailSignIn,
  onGoogleSignIn,
}: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = normalizeUserEmail(email);

    if (!isValidUserEmail(normalizedEmail)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setEmailError("");
    await onEmailSignIn(normalizedEmail);
  }

  function keepModalOpen(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end bg-black/40 px-3 py-4 sm:items-center sm:justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            onClick={keepModalOpen}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[color:var(--border)] p-4">
              <div>
                <h2 className="text-lg font-extrabold text-[color:var(--foreground)]">
                  {title}
                </h2>
                <p className="mt-1 text-sm leading-5 text-[color:var(--muted-foreground)]">
                  {description}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-2 hover:bg-[color:var(--muted)]"
                aria-label="Close sign in"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <Button
                className="h-11 w-full text-sm"
                disabled={!supabaseReady || loading}
                onClick={onGoogleSignIn}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                Continue with Google
              </Button>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="h-px bg-[color:var(--border)]" />
                <span className="text-[10px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
                  or
                </span>
                <div className="h-px bg-[color:var(--border)]" />
              </div>

              <form className="space-y-2" onSubmit={handleEmailSubmit}>
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-[color:var(--foreground)]">
                    Email magic link
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
                <Button
                  className="w-full"
                  disabled={!supabaseReady || loading}
                  type="submit"
                  variant="outline"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Send magic link
                </Button>
              </form>

              {emailError || error || emailNotice ? (
                <p
                  className={
                    emailError || error
                      ? "rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700"
                      : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"
                  }
                >
                  {emailError || error || emailNotice}
                </p>
              ) : null}

              {!supabaseReady ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
                  Supabase Auth is not configured yet.
                </p>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
