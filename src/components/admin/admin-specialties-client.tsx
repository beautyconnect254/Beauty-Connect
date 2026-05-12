"use client";

import { useMemo, useState } from "react";
import { BadgePlus, Plus, Scissors, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RoleSpecialtyCatalog, WorkerRole } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AdminSpecialtiesClientProps {
  initialCatalog: RoleSpecialtyCatalog[];
}

export function AdminSpecialtiesClient({
  initialCatalog,
}: AdminSpecialtiesClientProps) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [titleName, setTitleName] = useState("");
  const [selectedRole, setSelectedRole] = useState<WorkerRole>(
    initialCatalog[0]?.role ?? "Barber",
  );
  const [specialtyName, setSpecialtyName] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedRoleRecord = useMemo(
    () => catalog.find((role) => role.role === selectedRole) ?? catalog[0],
    [catalog, selectedRole],
  );

  async function addTitleSpeciality() {
    const name = titleName.trim();

    if (!name || catalog.some((role) => role.role.toLowerCase() === name.toLowerCase())) {
      return;
    }

    setSaving(true);
    setNotice("");

    try {
      const response = await fetch("/api/admin/specialties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "title", name }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        role?: RoleSpecialtyCatalog;
      } | null;

      if (!response.ok || !body?.role) {
        throw new Error(body?.error ?? "Could not add title speciality.");
      }

      setCatalog((current) => [...current, body.role as RoleSpecialtyCatalog]);
      setSelectedRole(body.role.role);
      setTitleName("");
      setNotice(`${body.role.role} was added.`);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not add title speciality.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function addSubSpeciality() {
    const name = specialtyName.trim();

    if (!name || !selectedRoleRecord) {
      return;
    }

    setSaving(true);
    setNotice("");

    try {
      const response = await fetch("/api/admin/specialties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "sub-speciality",
          role: selectedRoleRecord.role,
          name,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        skill?: { id: string; name: string; role: string };
      } | null;

      if (!response.ok || !body?.skill) {
        throw new Error(body?.error ?? "Could not add sub-speciality.");
      }

      const nextSkill = body.skill;

      setCatalog((current) =>
        current.map((role) =>
          role.role === selectedRoleRecord.role
            ? {
                ...role,
                specialties: role.specialties.some(
                  (specialty) => specialty.name.toLowerCase() === name.toLowerCase(),
                )
                  ? role.specialties
                  : [...role.specialties, nextSkill],
              }
            : role,
        ),
      );
      setSpecialtyName("");
      setNotice(`${name} was added under ${selectedRoleRecord.role}.`);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not add sub-speciality.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeSubSpeciality(
    role: WorkerRole,
    specialtyId: string,
    specialtyNameToRemove: string,
  ) {
    setSaving(true);
    setNotice("");

    try {
      const response = await fetch("/api/admin/specialties", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          specialtyId,
          specialtyName: specialtyNameToRemove,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not remove sub-speciality.");
      }

      setCatalog((current) =>
        current.map((item) =>
          item.role === role
            ? {
                ...item,
                specialties: item.specialties.filter(
                  (specialty) => specialty.id !== specialtyId,
                ),
              }
            : item,
        ),
      );
      setNotice(`${specialtyNameToRemove} was removed.`);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not remove sub-speciality.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="h-fit lg:sticky lg:top-4">
        <CardHeader className="border-b border-[color:var(--border)]">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            <CardTitle>Title Specialities</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Input
              value={titleName}
              onChange={(event) => setTitleName(event.target.value)}
              placeholder="Barber, Braider, Stylist"
            />
            <Button
              onClick={() => void addTitleSpeciality()}
              className="w-full"
              disabled={saving}
            >
              <Plus className="h-4 w-4" />
              Add title
            </Button>
          </div>

          <div className="grid gap-1.5">
            {catalog.map((role) => (
              <button
                key={role.role}
                type="button"
                onClick={() => setSelectedRole(role.role)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-extrabold transition",
                  selectedRoleRecord?.role === role.role
                    ? "bg-[color:var(--foreground)] text-white"
                    : "bg-[color:var(--muted)] text-[color:var(--foreground)] hover:bg-emerald-100",
                )}
              >
                <span className="truncate">{role.role}</span>
                <span className="shrink-0 text-xs opacity-80">
                  {role.specialties.length}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-[color:var(--border)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{selectedRoleRecord?.role ?? "Speciality"}</CardTitle>
            <Badge variant="outline">
              {selectedRoleRecord?.specialties.length ?? 0} sub-specialities
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {notice ? (
            <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]">
              {notice}
            </div>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              value={specialtyName}
              onChange={(event) => setSpecialtyName(event.target.value)}
              placeholder="Fade Specialist, Knotless Braids"
            />
            <Button onClick={() => void addSubSpeciality()} disabled={saving}>
              <BadgePlus className="h-4 w-4" />
              Add sub-speciality
            </Button>
          </div>

          {selectedRoleRecord ? (
            <div className="flex flex-wrap gap-2">
              {selectedRoleRecord.specialties.map((specialty) => (
                <button
                  type="button"
                  key={specialty.id}
                  onClick={() =>
                    void removeSubSpeciality(
                      selectedRoleRecord.role,
                      specialty.id,
                      specialty.name,
                    )
                  }
                  disabled={saving}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white px-3 py-1.5 text-xs font-extrabold text-[color:var(--foreground)] hover:bg-[color:var(--muted)]"
                >
                  <span className="truncate">{specialty.name}</span>
                  <X className="h-3 w-3 shrink-0" />
                </button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
