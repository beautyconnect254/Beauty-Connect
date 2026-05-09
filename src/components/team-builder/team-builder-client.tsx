"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Minus,
  Plus,
  Sparkles,
} from "lucide-react";

import { WorkerCard } from "@/components/workers/worker-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  SkillRecord,
  TeamRequestUrgency,
  Worker,
  WorkerCategory,
  WorkType,
} from "@/lib/types";
import { compactRoles, totalHeadcount, urgencyLabel } from "@/lib/utils";

interface TeamBuilderClientProps {
  workers: Worker[];
  categories: WorkerCategory[];
  locations: string[];
  skills: SkillRecord[];
}

interface DraftRequest {
  salon_name: string;
  contact_name: string;
  contact_email: string;
  contact_whatsapp: string;
  location: string;
  work_type: WorkType | "all";
  verified_only: boolean;
  urgency: TeamRequestUrgency;
  target_start_date: string;
  notes: string;
}

interface DraftRole {
  id: string;
  role: WorkerCategory["role"];
  quantity: number;
  min_experience: number;
  specialty_ids: string[];
}

const steps = [
  { label: "Request brief" },
  { label: "Build team" },
  { label: "Review matches" },
] as const;

const defaultDraft: DraftRequest = {
  salon_name: "",
  contact_name: "",
  contact_email: "",
  contact_whatsapp: "",
  location: "All locations",
  work_type: "full-time",
  verified_only: true,
  urgency: "priority",
  target_start_date: "",
  notes: "",
};

export function TeamBuilderClient({
  workers,
  categories,
  locations,
  skills,
}: TeamBuilderClientProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [roles, setRoles] = useState<DraftRole[]>(
    categories.map((category) => ({
      id: `draft-role-${category.role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      role: category.role,
      quantity: 0,
      min_experience: 3,
      specialty_ids: [],
    })),
  );
  const [draft, setDraft] = useState<DraftRequest>(defaultDraft);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedRoles = roles.filter((item) => item.quantity > 0);

  const roleRecommendations = useMemo(
    () =>
      selectedRoles.map((roleDraft) => {
        const roleSkills = skills.filter((skill) => skill.role === roleDraft.role);
        const specialtyMatches = roleSkills.filter((skill) =>
          roleDraft.specialty_ids.includes(skill.id),
        );
        const candidates = workers
          .filter((worker) => {
            if (worker.primary_role !== roleDraft.role) {
              return false;
            }

            if (draft.verified_only && worker.verification_status !== "verified") {
              return false;
            }

            if (worker.availability_status !== "available") {
              return false;
            }

            if (worker.years_of_experience < roleDraft.min_experience) {
              return false;
            }

            if (draft.location !== "All locations" && worker.location !== draft.location) {
              return false;
            }

            if (draft.work_type !== "all" && worker.work_type !== draft.work_type) {
              return false;
            }

            if (specialtyMatches.length === 0) {
              return true;
            }

            return specialtyMatches.some((skill) =>
              worker.skills.some((workerSkill) => workerSkill.id === skill.id),
            );
          })
          .map((worker) => ({
            worker,
            matchedSpecialties: specialtyMatches.filter((skill) =>
              worker.skills.some((workerSkill) => workerSkill.id === skill.id),
            ),
            score:
              specialtyMatches.filter((skill) =>
                worker.skills.some((workerSkill) => workerSkill.id === skill.id),
              ).length *
                30 +
              (worker.years_of_experience - roleDraft.min_experience) * 5 +
              20,
          }))
          .sort((left, right) => right.score - left.score);

        return {
          roleDraft,
          specialtyMatches,
          candidates,
        };
      }),
    [draft.location, draft.verified_only, draft.work_type, selectedRoles, skills, workers],
  );

  const totalMatches = roleRecommendations.reduce(
    (total, role) => total + role.candidates.length,
    0,
  );

  const requestSummary = selectedRoles.length
    ? compactRoles(selectedRoles)
    : "No roles selected yet";

  function updateRole(roleId: string, updater: (role: DraftRole) => DraftRole) {
    setRoles((current) =>
      current.map((role) => (role.id === roleId ? updater(role) : role)),
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle>Staffing workflow</CardTitle>
              <Badge variant="outline">{steps[stepIndex]?.label}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {steps.map((step, index) => (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => setStepIndex(index)}
                  className={`rounded-[22px] border px-4 py-3 text-left transition ${
                    stepIndex === index
                      ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                      : "border-[color:var(--border)] bg-white/70 text-[color:var(--foreground)]"
                  }`}
                >
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p
                    className={`mt-1 text-xs ${
                      stepIndex === index
                        ? "text-white/70"
                        : "text-[color:var(--muted-foreground)]"
                    }`}
                  >
                    Step {index + 1}
                  </p>
                </button>
              ))}
            </div>
          </CardHeader>
        </Card>

        {stepIndex === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Request brief</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Salon name
                </label>
                <Input
                  value={draft.salon_name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      salon_name: event.target.value,
                    }))
                  }
                  placeholder="Luna House Salon"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Contact name
                </label>
                <Input
                  value={draft.contact_name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      contact_name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Contact email
                </label>
                <Input
                  type="email"
                  value={draft.contact_email}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      contact_email: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Contact WhatsApp
                </label>
                <Input
                  value={draft.contact_whatsapp}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      contact_whatsapp: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Location
                </label>
                <Select
                  value={draft.location}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                >
                  <option>All locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Preferred work type
                </label>
                <Select
                  value={draft.work_type}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      work_type: event.target.value as DraftRequest["work_type"],
                    }))
                  }
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="all">Any work type</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Urgency
                </label>
                <Select
                  value={draft.urgency}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      urgency: event.target.value as TeamRequestUrgency,
                    }))
                  }
                >
                  <option value="standard">Standard</option>
                  <option value="priority">Priority</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Target start date
                </label>
                <Input
                  type="date"
                  value={draft.target_start_date}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      target_start_date: event.target.value,
                    }))
                  }
                />
              </div>
              <label className="flex items-center justify-between gap-4 rounded-[24px] bg-[color:var(--secondary)] px-4 py-3 text-sm font-medium text-[color:var(--foreground)] md:col-span-2">
                Verified workers only
                <input
                  type="checkbox"
                  checked={draft.verified_only}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      verified_only: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[color:var(--primary)]"
                />
              </label>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Operational notes
                </label>
                <Textarea
                  value={draft.notes}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Describe opening timelines, client mix, service standards, or anything the staffing team should know."
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {stepIndex === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle>Build the workforce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.map((category) => {
                const roleDraft = roles.find((role) => role.role === category.role);
                const roleSkills = skills.filter((skill) => skill.role === category.role);

                if (!roleDraft) {
                  return null;
                }

                return (
                  <div
                    key={category.role}
                    className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--secondary)]/65 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <p className="font-semibold text-[color:var(--foreground)]">
                          {category.role}
                        </p>
                        <p className="max-w-2xl text-sm leading-6 text-[color:var(--muted-foreground)]">
                          {category.typical_team_use}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-white"
                          onClick={() =>
                            updateRole(roleDraft.id, (current) => ({
                              ...current,
                              quantity: Math.max(0, current.quantity - 1),
                            }))
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="min-w-16 text-center">
                          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                            Qty
                          </p>
                          <p className="text-2xl font-semibold text-[color:var(--foreground)]">
                            {roleDraft.quantity}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                          onClick={() =>
                            updateRole(roleDraft.id, (current) => ({
                              ...current,
                              quantity: current.quantity + 1,
                            }))
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[color:var(--foreground)]">
                          Minimum experience
                        </label>
                        <Select
                          value={String(roleDraft.min_experience)}
                          onChange={(event) =>
                            updateRole(roleDraft.id, (current) => ({
                              ...current,
                              min_experience: Number(event.target.value),
                            }))
                          }
                        >
                          <option value="1">1+ years</option>
                          <option value="3">3+ years</option>
                          <option value="5">5+ years</option>
                          <option value="7">7+ years</option>
                          <option value="10">10+ years</option>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[color:var(--foreground)]">
                          Specialties
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {roleSkills.map((skill) => {
                            const active = roleDraft.specialty_ids.includes(skill.id);

                            return (
                              <button
                                key={skill.id}
                                type="button"
                                onClick={() =>
                                  updateRole(roleDraft.id, (current) => ({
                                    ...current,
                                    specialty_ids: current.specialty_ids.includes(skill.id)
                                      ? current.specialty_ids.filter((item) => item !== skill.id)
                                      : [...current.specialty_ids, skill.id],
                                  }))
                                }
                                className={`rounded-full border px-3 py-2 text-sm transition ${
                                  active
                                    ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                                    : "border-[color:var(--border)] bg-white text-[color:var(--foreground)]"
                                }`}
                              >
                                {skill.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : null}

        {stepIndex === 2 ? (
          <Card>
            <CardHeader>
              <CardTitle>Review workforce match</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                    Workforce request
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                    {requestSummary}
                  </p>
                </div>
                <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                    Urgency
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                    {urgencyLabel(draft.urgency)}
                  </p>
                </div>
                <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                    Candidate matches
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                    {totalMatches}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {roleRecommendations.length > 0 ? (
                  roleRecommendations.map((roleGroup) => (
                    <div key={roleGroup.roleDraft.id} className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-[color:var(--foreground)]">
                            {roleGroup.roleDraft.role}
                          </p>
                          <p className="text-sm text-[color:var(--muted-foreground)]">
                            {roleGroup.roleDraft.quantity} hire target ·{" "}
                            {roleGroup.roleDraft.min_experience}+ years
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {roleGroup.specialtyMatches.map((skill) => (
                            <Badge
                              key={skill.id}
                              variant="outline"
                              className="normal-case tracking-normal"
                            >
                              {skill.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {roleGroup.candidates.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {roleGroup.candidates
                            .slice(0, Math.max(roleGroup.roleDraft.quantity, 2))
                            .map((candidate) => (
                              <div key={`${roleGroup.roleDraft.id}-${candidate.worker.id}`} className="space-y-3">
                                <WorkerCard worker={candidate.worker} compact />
                                <div className="rounded-[22px] bg-[color:var(--secondary)] p-4">
                                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                                    Why this worker
                                  </p>
                                  <ul className="mt-2 space-y-2 text-sm leading-6 text-[color:var(--foreground)]">
                                    <li>
                                      <BriefcaseBusiness className="mr-2 inline h-4 w-4 text-[color:var(--primary)]" />
                                      {candidate.worker.years_of_experience} years experience
                                    </li>
                                    <li>
                                      <Clock3 className="mr-2 inline h-4 w-4 text-[color:var(--primary)]" />
                                      Available now for staffing review
                                    </li>
                                    {candidate.matchedSpecialties.length > 0 ? (
                                      <li>
                                        <Sparkles className="mr-2 inline h-4 w-4 text-[color:var(--primary)]" />
                                        Matches {candidate.matchedSpecialties.length} requested
                                        specialties
                                      </li>
                                    ) : null}
                                  </ul>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="rounded-[24px] border border-dashed border-[color:var(--border)] p-4 text-sm leading-6 text-[color:var(--muted-foreground)]">
                          No verified available workers currently match this role,
                          specialty, and location combination.
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-[color:var(--border)] p-4 text-sm leading-6 text-[color:var(--muted-foreground)]">
                    Add at least one role in step two to generate workforce recommendations.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Request summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                Team scope
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[color:var(--foreground)]">
                {totalHeadcount(selectedRoles)} total hires
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                {requestSummary}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                  Location
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                  {draft.location}
                </p>
              </div>
              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                  Urgency
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                  {urgencyLabel(draft.urgency)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
                disabled={stepIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous step
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setStepIndex((current) => Math.min(current + 1, steps.length - 1))
                }
                disabled={stepIndex === steps.length - 1}
              >
                Next step
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                className="gap-2"
                disabled={selectedRoles.length === 0 || isPending}
                onClick={() =>
                  startTransition(() => {
                    setSubmittedAt(new Date().toISOString());
                  })
                }
              >
                <Sparkles className="h-4 w-4" />
                {isPending ? "Preparing request..." : "Submit staffing request"}
              </Button>
            </div>

            {submittedAt ? (
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-semibold">Request sent to Beauty Connect ops</p>
                    <p className="mt-1 text-sm leading-6">
                      {draft.salon_name || "Unnamed salon"} has requested {requestSummary.toLowerCase()}.
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em]">
                      Submitted {format(new Date(submittedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
