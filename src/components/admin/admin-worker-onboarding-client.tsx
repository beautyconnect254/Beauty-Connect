"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ImagePlus,
  ListChecks,
  Loader2,
  Save,
  UserRoundPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { compressImageFile } from "@/lib/image-compression";
import type { RoleSpecialtyCatalog, Worker, WorkerRole } from "@/lib/types";
import { availabilityLabel, cn } from "@/lib/utils";
import { WORKER_MEDIA_MAX_FILES_PER_UPLOAD } from "@/lib/worker-media";

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
  experience_years: string;
  experience_months: string;
  bio: string;
  primary_role: WorkerRole;
  location: string;
  selected_skill_ids: string[];
  availability_status: Worker["availability_status"];
  listed_publicly: boolean;
}

function createBlankDraft(defaultRole: WorkerRole, defaultLocation = "Nairobi"): WorkerDraft {
  return {
    full_name: "",
    whatsapp_number: "",
    id_number: "",
    profile_photo: "",
    portfolio_urls: "",
    experience_years: "3",
    experience_months: "0",
    bio: "",
    primary_role: defaultRole,
    location: defaultLocation,
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
    draft.experience_years || draft.experience_months,
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
  const defaultLocation = locations[0] ?? "Nairobi";
  const [workers, setWorkers] = useState(initialWorkers);
  const [draft, setDraft] = useState(createBlankDraft(defaultRole, defaultLocation));
  const [notice, setNotice] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCatalog, setUploadingCatalog] = useState(false);
  const [savingWorker, setSavingWorker] = useState(false);
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
  const isUploading = uploadingProfile || uploadingCatalog;
  const isBusy = isUploading || savingWorker;

  function toggleSkill(skillId: string) {
    setDraft((current) => ({
      ...current,
      selected_skill_ids: current.selected_skill_ids.includes(skillId)
        ? current.selected_skill_ids.filter((id) => id !== skillId)
        : [...current.selected_skill_ids, skillId],
    }));
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getUploadError(error: unknown) {
    return error instanceof Error ? error.message : "Image upload failed.";
  }

  function appendPortfolioUrls(urls: string[]) {
    setDraft((current) => {
      const existingUrls = current.portfolio_urls
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      const uniqueUrls = Array.from(new Set([...existingUrls, ...urls]));

      return {
        ...current,
        portfolio_urls: uniqueUrls.join("\n"),
      };
    });
  }

  async function uploadWorkerMedia(
    files: File[],
    kind: "profile" | "portfolio",
  ) {
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("workerName", draft.full_name.trim());
    files.forEach((file) => formData.append("files", file));

    const response = await fetch("/api/admin/worker-media", {
      method: "POST",
      body: formData,
    });
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      uploads?: Array<{
        publicUrl: string;
        size: number;
      }>;
    } | null;

    if (!response.ok) {
      throw new Error(body?.error ?? "Image upload failed.");
    }

    return body?.uploads ?? [];
  }

  async function uploadProfilePhoto(file: File) {
    setUploadingProfile(true);
    setUploadError("");

    try {
      const compressedFile = await compressImageFile(file, {
        maxWidth: 900,
        maxHeight: 900,
        quality: 0.78,
      });
      const [upload] = await uploadWorkerMedia([compressedFile], "profile");

      if (!upload?.publicUrl) {
        throw new Error("Supabase did not return a profile photo URL.");
      }

      setDraft((current) => ({ ...current, profile_photo: upload.publicUrl }));
      setNotice(
        `Profile photo uploaded (${formatBytes(file.size)} to ${formatBytes(
          compressedFile.size,
        )}).`,
      );
    } catch (error) {
      setUploadError(getUploadError(error));
    } finally {
      setUploadingProfile(false);
    }
  }

  async function uploadCatalogImages(files: File[]) {
    if (files.length === 0) {
      return;
    }

    if (files.length > WORKER_MEDIA_MAX_FILES_PER_UPLOAD) {
      setUploadError(
        `Upload ${WORKER_MEDIA_MAX_FILES_PER_UPLOAD} catalog images or fewer at a time.`,
      );
      return;
    }

    setUploadingCatalog(true);
    setUploadError("");

    try {
      const compressedFiles = await Promise.all(
        files.map((file) =>
          compressImageFile(file, {
            maxWidth: 1400,
            maxHeight: 1400,
            quality: 0.74,
          }),
        ),
      );
      const uploads = await uploadWorkerMedia(compressedFiles, "portfolio");
      const urls = uploads.map((upload) => upload.publicUrl).filter(Boolean);

      if (urls.length !== compressedFiles.length) {
        throw new Error("Some catalog images did not return public URLs.");
      }

      appendPortfolioUrls(urls);
      setNotice(
        `Uploaded ${urls.length} catalog image${
          urls.length === 1 ? "" : "s"
        } (${formatBytes(
          files.reduce((total, file) => total + file.size, 0),
        )} to ${formatBytes(
          compressedFiles.reduce((total, file) => total + file.size, 0),
        )}).`,
      );
    } catch (error) {
      setUploadError(getUploadError(error));
    } finally {
      setUploadingCatalog(false);
    }
  }

  function totalExperienceYears() {
    const years = Math.max(Number(draft.experience_years) || 0, 0);
    const months = Math.min(Math.max(Number(draft.experience_months) || 0, 0), 11);

    return Math.max(years + (months >= 6 ? 1 : 0), months > 0 ? 1 : 0);
  }

  async function saveWorker() {
    if (!draft.full_name.trim()) {
      setNotice("Worker name is required before saving.");
      return;
    }

    if (draft.listed_publicly && !draft.profile_photo.trim()) {
      setNotice("Add a profile photo before publishing this worker to /workers.");
      return;
    }

    const allPortfolioImages = portfolioUrls;
    const selectedSkills = skillsForRole.filter((skill) =>
      draft.selected_skill_ids.includes(skill.id),
    );

    setSavingWorker(true);
    setUploadError("");

    try {
      const response = await fetch("/api/admin/workers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: draft.full_name,
          whatsapp_number: draft.whatsapp_number,
          id_number: draft.id_number,
          profile_photo: draft.profile_photo,
          portfolio_urls: allPortfolioImages,
          years_of_experience: totalExperienceYears(),
          bio: draft.bio,
          primary_role: draft.primary_role,
          location: draft.location,
          selected_skills: selectedSkills,
          availability_status: draft.availability_status,
          listed_publicly: draft.listed_publicly,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        worker?: Worker;
      } | null;

      if (!response.ok || !body?.worker) {
        throw new Error(body?.error ?? "Could not save worker.");
      }

      setWorkers((current) => [body.worker as Worker, ...current]);
      setDraft(createBlankDraft(defaultRole, defaultLocation));
      setNotice(
        body.worker.listed_publicly
          ? `${body.worker.full_name} is now published on /workers.`
          : `${body.worker.full_name} was added to the internal onboarding roster.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save worker.");
    } finally {
      setSavingWorker(false);
    }
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
          {uploadError ? (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{uploadError}</p>
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
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min="0"
                  value={draft.experience_years}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      experience_years: event.target.value,
                    }))
                  }
                  aria-label="Years of experience"
                  placeholder="Years"
                />
                <Input
                  type="number"
                  min="0"
                  max="11"
                  value={draft.experience_months}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      experience_months: event.target.value,
                    }))
                  }
                  aria-label="Months of experience"
                  placeholder="Months"
                />
              </div>
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
                Location
              </label>
              <Select
                value={draft.location}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, location: event.target.value }))
                }
              >
                {Array.from(new Set([...locations, "Nairobi"])).map((location) => (
                  <option key={location} value={location}>
                    {location}
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
                  disabled={uploadingProfile}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.currentTarget.value = "";

                    if (file) {
                      void uploadProfilePhoto(file);
                    }
                  }}
                />
                {uploadingProfile ? (
                  <div className="flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading profile photo...
                  </div>
                ) : null}
                {draft.profile_photo ? (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-[color:var(--muted)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={draft.profile_photo}
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
                  disabled={uploadingCatalog}
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    event.currentTarget.value = "";
                    void uploadCatalogImages(files);
                  }}
                />
                {uploadingCatalog ? (
                  <div className="flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading catalog images...
                  </div>
                ) : null}
                <div className="grid grid-cols-3 gap-2">
                  {portfolioUrls.slice(0, 6).map((imageUrl) => (
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
                Publish on /workers
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
              Published workers are verified and visible to salon owners.
            </div>
            <Button disabled={isBusy} onClick={() => void saveWorker()}>
              {savingWorker ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isBusy ? "Saving..." : "Save worker"}
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
              <Badge
                variant={
                  worker.listed_publicly && worker.verification_status === "verified"
                    ? "verified"
                    : "outline"
                }
              >
                {worker.listed_publicly && worker.verification_status === "verified"
                  ? "Public"
                  : "Internal"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
