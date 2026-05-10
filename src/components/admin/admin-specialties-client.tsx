"use client";

import { useMemo, useState } from "react";
import { BadgePlus, Layers3, Plus, Scissors } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RoleSpecialtyCatalog, WorkerRole } from "@/lib/types";

interface AdminSpecialtiesClientProps {
  initialCatalog: RoleSpecialtyCatalog[];
  mode: "roles" | "sub-specialties";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function AdminSpecialtiesClient({
  initialCatalog,
  mode,
}: AdminSpecialtiesClientProps) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleUse, setRoleUse] = useState("");
  const [selectedRole, setSelectedRole] = useState<WorkerRole>(
    initialCatalog[0]?.role ?? "Barber",
  );
  const [specialtyName, setSpecialtyName] = useState("");
  const selectedRoleRecord = useMemo(
    () => catalog.find((role) => role.role === selectedRole) ?? catalog[0],
    [catalog, selectedRole],
  );

  function addRole() {
    const name = roleName.trim();

    if (!name || catalog.some((role) => role.role.toLowerCase() === name.toLowerCase())) {
      return;
    }

    setCatalog((current) => [
      ...current,
      {
        role: name,
        description: roleDescription.trim(),
        typical_team_use: roleUse.trim(),
        specialties: [],
      },
    ]);
    setSelectedRole(name);
    setRoleName("");
    setRoleDescription("");
    setRoleUse("");
  }

  function updateRole(
    role: WorkerRole,
    field: "description" | "typical_team_use",
    value: string,
  ) {
    setCatalog((current) =>
      current.map((item) =>
        item.role === role
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addSpecialty() {
    const name = specialtyName.trim();

    if (!name || !selectedRoleRecord) {
      return;
    }

    setCatalog((current) =>
      current.map((role) =>
        role.role === selectedRoleRecord.role
          ? {
              ...role,
              specialties: role.specialties.some(
                (specialty) => specialty.name.toLowerCase() === name.toLowerCase(),
              )
                ? role.specialties
                : [
                    ...role.specialties,
                    {
                      id: `skill-${slugify(role.role)}-${slugify(name)}`,
                      name,
                      role: role.role,
                    },
                  ],
            }
          : role,
      ),
    );
    setSpecialtyName("");
  }

  function removeSpecialty(role: WorkerRole, specialtyId: string) {
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
  }

  if (mode === "roles") {
    return (
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader className="border-b border-[color:var(--border)]">
            <CardTitle>Create Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              placeholder="Barber, Hairstylist, Spa Specialist"
            />
            <Textarea
              value={roleDescription}
              onChange={(event) => setRoleDescription(event.target.value)}
              placeholder="Operational description"
            />
            <Textarea
              value={roleUse}
              onChange={(event) => setRoleUse(event.target.value)}
              placeholder="Typical team use"
            />
            <Button onClick={addRole} className="w-full">
              <Plus className="h-4 w-4" />
              Add role
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[color:var(--border)]">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              <CardTitle>Roles</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {catalog.map((role) => (
              <div
                key={role.role}
                className="space-y-3 rounded-md border border-[color:var(--border)] bg-white p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                      {role.role}
                    </p>
                    <p className="text-xs text-[color:var(--muted-foreground)]">
                      {role.specialties.length} sub-specialties
                    </p>
                  </div>
                  <Badge variant="outline">Dynamic</Badge>
                </div>
                <Textarea
                  value={role.description}
                  onChange={(event) =>
                    updateRole(role.role, "description", event.target.value)
                  }
                  className="min-h-20"
                />
                <Textarea
                  value={role.typical_team_use}
                  onChange={(event) =>
                    updateRole(role.role, "typical_team_use", event.target.value)
                  }
                  className="min-h-20"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader className="border-b border-[color:var(--border)]">
          <CardTitle>Add Sub-Specialty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
          >
            {catalog.map((role) => (
              <option key={role.role} value={role.role}>
                {role.role}
              </option>
            ))}
          </Select>
          <Input
            value={specialtyName}
            onChange={(event) => setSpecialtyName(event.target.value)}
            placeholder="Fade Specialist, Razor Styling"
          />
          <Button onClick={addSpecialty} className="w-full">
            <BadgePlus className="h-4 w-4" />
            Add sub-specialty
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-[color:var(--border)]">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4" />
            <CardTitle>Nested Specialty Catalog</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {catalog.map((role) => (
            <div
              key={role.role}
              className="rounded-md border border-[color:var(--border)] bg-white p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                    {role.role}
                  </p>
                  <p className="text-xs text-[color:var(--muted-foreground)]">
                    Powers onboarding, team builder, filters, and matching.
                  </p>
                </div>
                <Badge variant="outline">{role.specialties.length}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {role.specialties.map((specialty) => (
                  <button
                    type="button"
                    key={specialty.id}
                    onClick={() => removeSpecialty(role.role, specialty.id)}
                    className="rounded-full border border-[color:var(--border)] px-3 py-1.5 text-xs font-extrabold text-[color:var(--foreground)] hover:bg-[color:var(--muted)]"
                  >
                    {specialty.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
