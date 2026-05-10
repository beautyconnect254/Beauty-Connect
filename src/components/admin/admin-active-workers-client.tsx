"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  History,
  Power,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Worker } from "@/lib/types";
import { availabilityLabel, cn, verificationLabel } from "@/lib/utils";

interface AdminActiveWorkersClientProps {
  initialWorkers: Worker[];
}

function statusVariant(status: Worker["availability_status"]) {
  if (status === "available") {
    return "verified";
  }

  if (status === "reserved") {
    return "pending";
  }

  return "default";
}

export function AdminActiveWorkersClient({
  initialWorkers,
}: AdminActiveWorkersClientProps) {
  const [workers, setWorkers] = useState(initialWorkers);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState(initialWorkers[0]?.id ?? "");
  const roles = useMemo(
    () => Array.from(new Set(workers.map((worker) => worker.primary_role))).sort(),
    [workers],
  );
  const filteredWorkers = workers.filter((worker) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      worker.full_name.toLowerCase().includes(query) ||
      worker.primary_role.toLowerCase().includes(query) ||
      worker.skills.some((skill) => skill.name.toLowerCase().includes(query));

    return (
      matchesSearch &&
      (role === "all" || worker.primary_role === role) &&
      (status === "all" || worker.availability_status === status)
    );
  });
  const selectedWorker =
    workers.find((worker) => worker.id === selectedId) ?? filteredWorkers[0] ?? null;

  function updateWorker(workerId: string, updates: Partial<Worker>) {
    setWorkers((current) =>
      current.map((worker) =>
        worker.id === workerId ? { ...worker, ...updates } : worker,
      ),
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader className="border-b border-[color:var(--border)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Active Workers</CardTitle>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                Compact roster view for status, listing, and booking history checks.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[180px_160px_160px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[color:var(--muted-foreground)]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search roster"
                  className="pl-9"
                />
              </div>
              <Select value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="all">All roles</option>
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">All status</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="hired">Hired</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden border-b border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)] md:grid md:grid-cols-[minmax(220px,1.2fr)_1fr_0.7fr_0.65fr_0.8fr]">
            <span>Worker</span>
            <span>Specialties</span>
            <span>Experience</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-[color:var(--border)]">
            {filteredWorkers.map((worker) => (
              <div
                key={worker.id}
                className={cn(
                  "grid gap-3 px-3 py-3 md:grid-cols-[minmax(220px,1.2fr)_1fr_0.7fr_0.65fr_0.8fr] md:items-center",
                  selectedWorker?.id === worker.id ? "bg-emerald-50/60" : "bg-white",
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(worker.id)}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-[color:var(--muted)]">
                    {worker.profile_photo ? (
                      <Image
                        src={worker.profile_photo}
                        alt={worker.full_name}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[color:var(--foreground)]">
                      {worker.full_name}
                    </p>
                    <p className="truncate text-xs text-[color:var(--muted-foreground)]">
                      {worker.primary_role} - {verificationLabel(worker.verification_status)}
                    </p>
                  </div>
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {worker.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill.id} variant="outline" className="normal-case">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  {worker.years_of_experience} yrs
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={statusVariant(worker.availability_status)}>
                    {availabilityLabel(worker.availability_status)}
                  </Badge>
                  <Badge variant={worker.listed_publicly ? "verified" : "outline"}>
                    {worker.listed_publicly ? "Listed" : "Off"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedId(worker.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateWorker(worker.id, {
                        listed_publicly: false,
                        featured: false,
                        featured_status: "off",
                      })
                    }
                  >
                    <Power className="h-3.5 w-3.5" />
                    Deactivate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="border-b border-[color:var(--border)]">
          <CardTitle>Worker Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedWorker ? (
            <>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-md bg-[color:var(--muted)]">
                  {selectedWorker.profile_photo ? (
                    <Image
                      src={selectedWorker.profile_photo}
                      alt={selectedWorker.full_name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-[color:var(--foreground)]">
                    {selectedWorker.full_name}
                  </p>
                  <p className="truncate text-xs text-[color:var(--muted-foreground)]">
                    {selectedWorker.primary_role}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                  Update status
                </label>
                <Select
                  value={selectedWorker.availability_status}
                  onChange={(event) =>
                    updateWorker(selectedWorker.id, {
                      availability_status: event.target.value as Worker["availability_status"],
                    })
                  }
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="hired">Hired</option>
                </Select>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-sm font-extrabold text-[color:var(--foreground)]">
                Active listing status
                <input
                  type="checkbox"
                  checked={selectedWorker.listed_publicly}
                  onChange={(event) =>
                    updateWorker(selectedWorker.id, {
                      listed_publicly: event.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-[color:var(--foreground)]"
                />
              </label>

              <div className="space-y-2 rounded-md border border-[color:var(--border)] p-3">
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4" />
                  <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                    Current booking
                  </p>
                </div>
                <p className="text-sm leading-5 text-[color:var(--muted-foreground)]">
                  {selectedWorker.active_assignment
                    ? `${availabilityLabel(selectedWorker.active_assignment.status === "hired" ? "hired" : "reserved")} on ${selectedWorker.active_assignment.salon_name}`
                    : "No reserved or hired assignment."}
                </p>
              </div>

              <div className="space-y-2 rounded-md border border-[color:var(--border)] p-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                    Bookings/history
                  </p>
                </div>
                <div className="space-y-2 text-sm leading-5 text-[color:var(--muted-foreground)]">
                  {selectedWorker.internal_notes.length > 0 ? (
                    selectedWorker.internal_notes.slice(0, 3).map((note) => (
                      <p key={note.id}>{note.note}</p>
                    ))
                  ) : (
                    <p>No internal history has been recorded yet.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-md border border-dashed border-[color:var(--border)] p-4 text-sm text-[color:var(--muted-foreground)]">
              Select a worker to edit status or view history.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
