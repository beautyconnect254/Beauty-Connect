"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ImagePlus, ListChecks, Save, UserRoundPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RoleSpecialtyCatalog, Worker, WorkerRole } from "@/lib/types";
import { availabilityLabel, cn } from "@/lib/utils";

interface AdminWorkerOnboardingClientProps {
  initialWorkers: Worker[];
  roleCatalog: RoleSpecialtyCatalog[];
  locations: string[];
}

interface WorkerDraft {
  full_name: string;
  whatsapp_number: string;
  id_number: string;
  profile_photo: string;
  portfolio_urls: string;
  years_of_experience: string;
  bio: string;
  primary_role: WorkerRole;
  selected_skill_ids: string[];
  availability_status: Worker["availability_status"];
  listed_publicly: boolean;
}

function createBlankDraft(defaultRole: WorkerRole): WorkerDraft {
  return {
    full_name: "",
    whatsapp_number: "",
    id_number: "",
    profile_photo: "",
    portfolio_urls: "",
    years_of_experience: "3",
    bio: "",
    primary_role: defaultRole,
    selected_skill_ids: [],
    availability_status: "available",
    listed_publicly: true,
  };
}

function draftScore(draft: WorkerDraft) {
  const checks = [
    draft.full_name,
    draft.whatsapp_number,
    draft.id_number,
    draft.profile_photo,
    draft.portfolio_urls,
    draft.years_of_experience,
    draft.primary_role,
    draft.selected_skill_ids.length > 0,
  ];

  return checks.filter(Boolean).length;
}

export function AdminWorkerOnboardingClient({
  initialWorkers,
  roleCatalog,
  locations,
}: AdminWorkerOnboardingClientProps) {
  const defaultRole = roleCatalog[0]?.role ?? "Barber";
  const [workers, setWorkers] = useState(initialWorkers);
  const [draft, setDraft] = useState(createBlankDraft(defaultRole));
  const [profilePreview, setProfilePreview] = useState("");
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const roles = useMemo(() => roleCatalog.map((role) => role.role), [roleCatalog]);
  const skillsForRole = useMemo(
    () =>
      roleCatalog.find((role) => role.role === draft.primary_role)?.specialties ?? [],
    [draft.primary_role, roleCatalog],
  );
  const completion = draftScore(draft);
  const portfolioUrls = draft.portfolio_urls
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  useEffect(() => {
    return () => {
      if (profilePreview) {
        URL.revokeObjectURL(profilePreview);
      }

      portfolioPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [portfolioPreviews, profilePreview]);

  function toggleSkill(skillId: string) {
    setDraft((current) => ({
      ...current,
      selected_skill_ids: current.selected_skill_ids.includes(skillId)
        ? current.selected_skill_ids.filter((id) => id !== skillId)
        : [...current.selected_skill_ids, skillId],
    }));
  }

  function saveWorker() {
    if (!draft.full_name.trim()) {
      setNotice("Worker name is required before saving.");
      return;
    }

    const id = `${draft.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${workers.length + 1}`;
    const allPortfolioImages = portfolioUrls;
    const selectedSkills = skillsForRole.filter((skill) =>
      draft.selected_skill_ids.includes(skill.id),
    );
    const nextWorker: Worker = {
      id,
      full_name: draft.full_name.trim(),
      id_number: draft.id_number.trim(),
      primary_role: draft.primary_role,
      profile_photo: draft.profile_photo,
      location: locations[0] ?? "Nairobi",
      years_of_experience: Number(draft.years_of_experience) || 0,
      bio: draft.bio.trim(),
      availability_status: draft.availability_status,
      verification_status: "pending",
      salary_expectation: 0,
      work_type: "contract",
      whatsapp_number: draft.whatsapp_number.trim(),
      headline: `${draft.primary_role} in onboarding`,
      featured: false,
      featured_status: "off",
      featured_expires_at: null,
      featured_frequency: 0,
      featured_priority_score: 0,
      listed_publicly: draft.listed_publicly,
      skills: selectedSkills,
      portfolio: allPortfolioImages.map((imageUrl, index) => ({
        id: `${id}-portfolio-${index}`,
        worker_id: id,
        image_url: imageUrl,
        caption: `Catalog image ${index + 1}`,
        is_cover: index === 0,
      })),
      verification_documents: [],
      reference_contacts: [],
      internal_notes: [
        {
          id: `${id}-note-onboarding`,
          worker_id: id,
          team_request_id: null,
          staffing_assignment_id: null,
          author: "Admin",
          note: "Worker listed through admin onboarding. Verify ID, references, and current availability before matching.",
          created_at: new Date().toISOString(),
        },
      ],
      active_assignment: null,
    };

    setWorkers((current) => [nextWorker, ...current]);
    setDraft(createBlankDraft(defaultRole));
    setProfilePreview("");
    setPortfolioPreviews([]);
    setNotice(`${nextWorker.full_name} was added to the internal onboarding roster.`);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader className="border-b border-[color:var(--border)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>List Worker</CardTitle>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                Capture the minimum staffing record needed to verify and match a worker.
              </p>
            </div>
            <Badge variant="outline">
              {completion}/8 ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {notice ? (
            <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]">
              {notice}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                Worker Name
              </label>
              <Input
                value={draft.full_name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, full_name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                Phone Number / WhatsApp
              </label>
              <Input
                value={draft.whatsapp_number}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    whatsapp_number: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                ID Number
              </label>
              <Input
                value={draft.id_number}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, id_number: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                Work Experience
              </label>
              <Input
                type="number"
                min="0"
                value={draft.years_of_experience}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    years_of_experience: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                Main Role
              </label>
              <Select
                value={draft.primary_role}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    primary_role: event.target.value,
                    selected_skill_ids: [],
                  }))
                }
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                Availability Status
              </label>
              <Select
                value={draft.availability_status}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    availability_status: event.target.value as Worker["availability_status"],
                  }))
                }
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="hired">Hired</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                  Sub-Specialties
                </label>
                <div className="flex flex-wrap gap-2 rounded-md border border-[color:var(--border)] bg-white p-3">
                  {skillsForRole.length > 0 ? (
                    skillsForRole.map((skill) => {
                      const active = draft.selected_skill_ids.includes(skill.id);

                      return (
                        <button
                          type="button"
                          key={skill.id}
                          onClick={() => toggleSkill(skill.id)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-extrabold transition",
                            active
                              ? "border-[color:var(--foreground)] bg-[color:var(--foreground)] text-white"
                              : "border-[color:var(--border)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)]",
                          )}
                        >
                          {skill.name}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                      Add sub-specialties for this role in Specialties first.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                  Portfolio/Catalog Images
                </label>
                <Textarea
                  value={draft.portfolio_urls}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      portfolio_urls: event.target.value,
                    }))
                  }
                  placeholder="One image URL per line"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                  Work Experience Notes
                </label>
                <Textarea
                  value={draft.bio}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, bio: event.target.value }))
                  }
                  placeholder="Previous salons, strongest services, reliability notes, client fit."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2 rounded-md border border-[color:var(--border)] p-3">
                <div className="flex items-center gap-2">
                  <UserRoundPlus className="h-4 w-4" />
                  <p className="text-xs font-extrabold text-[color:var(--foreground)]">
                    Profile Photo
                  </p>
                </div>
                <Input
                  value={draft.profile_photo}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      profile_photo: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    if (profilePreview) {
                      URL.revokeObjectURL(profilePreview);
                    }

                    const file = event.target.files?.[0];
                    setProfilePreview(file ? URL.createObjectURL(file) : "");
                  }}
                />
                {draft.profile_photo || profilePreview ? (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-[color:var(--muted)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profilePreview || draft.profile_photo}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 rounded-md border border-[color:var(--border)] p-3">
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" />
                  <p className="text-xs font-extrabold text-[color:var(--foreground)]">
                    Catalog Uploads
                  </p>
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    portfolioPreviews.forEach((url) => URL.revokeObjectURL(url));
                    setPortfolioPreviews(
                      Array.from(event.target.files ?? []).map((file) =>
                        URL.createObjectURL(file),
                      ),
                    );
                  }}
                />
                <div className="grid grid-cols-3 gap-2">
                  {[...portfolioUrls, ...portfolioPreviews].slice(0, 6).map((imageUrl) => (
                    <div
                      className="relative aspect-square overflow-hidden rounded-md bg-[color:var(--muted)]"
                      key={imageUrl}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Catalog preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-sm font-extrabold text-[color:var(--foreground)]">
                Active Listing Toggle
                <input
                  type="checkbox"
                  checked={draft.listed_publicly}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      listed_publicly: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[color:var(--foreground)]"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[color:var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--muted-foreground)]">
              <ListChecks className="h-4 w-4" />
              Reserved and hired workers are blocked from matching automatically.
            </div>
            <Button onClick={saveWorker}>
              <Save className="h-4 w-4" />
              Save worker
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="border-b border-[color:var(--border)]">
          <CardTitle>Recent Roster</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {workers.slice(0, 8).map((worker) => (
            <div
              key={worker.id}
              className="flex items-center gap-3 rounded-md border border-[color:var(--border)] bg-white p-2"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[color:var(--muted)]">
                {worker.profile_photo ? (
                  <Image
                    src={worker.profile_photo}
                    alt={worker.full_name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-[color:var(--foreground)]">
                  {worker.full_name}
                </p>
                <p className="truncate text-xs text-[color:var(--muted-foreground)]">
                  {worker.primary_role} - {availabilityLabel(worker.availability_status)}
                </p>
              </div>
              <Badge variant={worker.listed_publicly ? "verified" : "outline"}>
                {worker.listed_publicly ? "Active" : "Off"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
