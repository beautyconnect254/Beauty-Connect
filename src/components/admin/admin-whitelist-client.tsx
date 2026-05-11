"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Plus, ShieldCheck, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  isValidAdminEmail,
  normalizeAdminEmail,
  type AdminWhitelistRecord,
} from "@/lib/admin-auth-shared";

interface AdminWhitelistClientProps {
  currentAdminEmail: string;
  initialAdmins: AdminWhitelistRecord[];
}

async function readError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return body?.error || "Could not update admin access.";
}

function sortAdmins(admins: AdminWhitelistRecord[]) {
  return [...admins].sort((first, second) => {
    if (first.active !== second.active) {
      return first.active ? -1 : 1;
    }

    return first.email.localeCompare(second.email);
  });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminWhitelistClient({
  currentAdminEmail,
  initialAdmins,
}: AdminWhitelistClientProps) {
  const [admins, setAdmins] = useState(() => sortAdmins(initialAdmins));
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function mergeAdmin(admin: AdminWhitelistRecord) {
    setAdmins((current) =>
      sortAdmins([
        admin,
        ...current.filter((item) => item.email !== admin.email),
      ]),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = normalizeAdminEmail(email);

    if (!isValidAdminEmail(normalizedEmail)) {
      setMessage("Enter a valid admin email address.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const response = await fetch("/api/admin/whitelist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setMessage(await readError(response));
      return;
    }

    const body = (await response.json()) as {
      admin: AdminWhitelistRecord;
    };

    mergeAdmin(body.admin);
    setEmail("");
    setMessage(`${normalizedEmail} can now request an admin magic link.`);
  }

  async function updateAdminAccess(admin: AdminWhitelistRecord, active: boolean) {
    setPendingEmail(admin.email);
    setMessage("");

    const response = await fetch("/api/admin/whitelist", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: admin.email, active }),
    });

    setPendingEmail(null);

    if (!response.ok) {
      setMessage(await readError(response));
      return;
    }

    const body = (await response.json()) as {
      admin: AdminWhitelistRecord;
    };

    mergeAdmin(body.admin);
    setMessage(
      active
        ? `${admin.email} has active admin access.`
        : `${admin.email} has been deactivated.`,
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader className="border-b border-[color:var(--border)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <CardTitle>Assign Admin</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <label className="block space-y-1.5">
              <span className="text-xs font-extrabold uppercase text-[color:var(--muted-foreground)]">
                Email
              </span>
              <Input
                autoComplete="email"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                type="email"
                value={email}
              />
            </label>
            <Button className="w-full" disabled={submitting} type="submit">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Admin
            </Button>
          </form>

          {message ? (
            <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]">
              {message}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-[color:var(--border)]">
          <CardTitle>Admin Whitelist</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden border-b border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)] md:grid md:grid-cols-[1.1fr_0.35fr_0.55fr_0.55fr_0.5fr]">
            <span>Email</span>
            <span>Status</span>
            <span>Added by</span>
            <span>Updated</span>
            <span>Action</span>
          </div>

          <div className="divide-y divide-[color:var(--border)]">
            {admins.map((admin) => {
              const isCurrentAdmin = admin.email === currentAdminEmail;
              const pending = pendingEmail === admin.email;

              return (
                <div
                  className="grid gap-3 px-3 py-3 md:grid-cols-[1.1fr_0.35fr_0.55fr_0.55fr_0.5fr] md:items-center"
                  key={admin.email}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[color:var(--foreground)]">
                      {admin.email}
                    </p>
                    {isCurrentAdmin ? (
                      <p className="mt-0.5 text-xs font-semibold text-[color:var(--muted-foreground)]">
                        Current session
                      </p>
                    ) : null}
                  </div>

                  <Badge variant={admin.active ? "verified" : "outline"}>
                    {admin.active ? "Active" : "Inactive"}
                  </Badge>

                  <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">
                    {admin.added_by}
                  </p>

                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    {formatDate(admin.updated_at)}
                  </p>

                  <Button
                    className="w-full md:w-auto"
                    disabled={pending || (isCurrentAdmin && admin.active)}
                    onClick={() => updateAdminAccess(admin, !admin.active)}
                    size="sm"
                    type="button"
                    variant={admin.active ? "outline" : "default"}
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : admin.active ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {admin.active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              );
            })}

            {admins.length === 0 ? (
              <div className="px-3 py-6 text-sm font-semibold text-[color:var(--muted-foreground)]">
                No admin emails loaded.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
