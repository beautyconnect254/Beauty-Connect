"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  History,
  ImagePlus,
  Loader2,
  Power,
  Save,
  Search,
} from "lucide-react";

import { WorkerSpecialtySelector } from "@/components/admin/worker-specialty-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { activeBookingCountLabel } from "@/lib/capacity-rules";
import {
  experienceInputFromMonths,
  experienceYearsFromMonths,
  formatExperienceMonths,
  normalizeExperienceMonths,
  workerExperienceMonths,
  type ExperienceUnit,
} from "@/lib/experience";
import { compressImageFile } from "@/lib/image-compression";
import type { RoleSpecialtyCatalog, Worker } from "@/lib/types";
import { availabilityLabel, cn, verificationLabel } from "@/lib/utils";
import { WORKER_MEDIA_MAX_FILES_PER_UPLOAD } from "@/lib/worker-media";

interface AdminActiveWorkersClientProps {
  initialWorkers: Worker[];
  roleCatalog: RoleSpecialtyCatalog[];
  locations: string[];
}

interface WorkerEditDraft {
  primary_role: string;
  whatsapp_number: string;
  location: string;
  experience_value: string;
  experience_unit: ExperienceUnit;
  bio: string;
  headline: string;
  profile_photo: string;
  portfolio_urls: string;
  selected_skill_ids: string[];
  availability_status: Worker["availability_status"];
  listed_publicly: boolean;
  salary_expectation: string;
  work_type: Worker["work_type"];
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

function createEditDraft(worker: Worker): WorkerEditDraft {
  const experienceInput = experienceInputFromMonths(workerExperienceMonths(worker));

  return {
    primary_role: worker.primary_role,
    whatsapp_number: worker.whatsapp_number,
    location: worker.location,
    experience_value: String(experienceInput.value),
    experience_unit: experienceInput.unit,
    bio: worker.bio,
    headline: worker.headline,
    profile_photo: worker.profile_photo,
    portfolio_urls: worker.portfolio.map((item) => item.image_url).join("\n"),
    selected_skill_ids: worker.skills.map((skill) => skill.id),
    availability_status: worker.availability_status,
    listed_publicly: worker.listed_publicly,
    salary_expectation: String(worker.salary_expectation),
    work_type: worker.work_type,
  };
}

function portfolioUrlsFromDraft(draft: WorkerEditDraft | null) {
  return (draft?.portfolio_urls ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function readAdminError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return body?.error || "Could not update worker.";
}

export function AdminActiveWorkersClient({
  initialWorkers,
  roleCatalog,
  locations,
}: AdminActiveWorkersClientProps) {
  const [workers, setWorkers] = useState(initialWorkers);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState(initialWorkers[0]?.id ?? "");
  const [draft, setDraft] = useState<WorkerEditDraft | null>(
    initialWorkers[0] ? createEditDraft(initialWorkers[0]) : null,
  );
  const [notice, setNotice] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCatalog, setUploadingCatalog] = useState(false);
  const [savingWorkerId, setSavingWorkerId] = useState("");
  const allSpecialties = useMemo(
    () => roleCatalog.flatMap((item) => item.specialties),
    [roleCatalog],
  );
  const roles = useMemo(
    () =>
      Array.from(
        new Set([
          ...roleCatalog.map((item) => item.role),
          ...workers.map((worker) => worker.primary_role),
        ]),
      ).sort(),
    [roleCatalog, workers],
  );
  const filteredWorkers = workers.filter((worker) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      worker.full_name.toLowerCase().includes(query) ||
      worker.primary_role.toLowerCase().includes(query) ||
      worker.location.toLowerCase().includes(query) ||
      worker.skills.some((skill) => skill.name.toLowerCase().includes(query));

    return (
      matchesSearch &&
      (role === "all" || worker.primary_role === role) &&
      (status === "all" || worker.availability_status === status)
    );
  });
  const selectedWorker = workers.find((worker) => worker.id === selectedId) ?? null;
  const portfolioUrls = portfolioUrlsFromDraft(draft);
  const isUploading = uploadingProfile || uploadingCatalog;
  const isSaving = Boolean(savingWorkerId);

  function selectWorker(worker: Worker) {
    setSelectedId(worker.id);
    setDraft(createEditDraft(worker));
    setNotice("");
    setUploadError("");
  }

  function toggleSkill(skillId: string) {
    setDraft((current) =>
      current
        ? {
            ...current,
            selected_skill_ids: current.selected_skill_ids.includes(skillId)
              ? current.selected_skill_ids.filter((item) => item !== skillId)
              : [...current.selected_skill_ids, skillId],
          }
        : current,
    );
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function appendPortfolioUrls(urls: string[]) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const uniqueUrls = Array.from(
        new Set([...portfolioUrlsFromDraft(current), ...urls]),
      );

      return {
        ...current,
        portfolio_urls: uniqueUrls.join("\n"),
      };
    });
  }

  async function uploadWorkerMedia(
    worker: Worker,
    files: File[],
    kind: "profile" | "portfolio",
  ) {
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("workerName", worker.full_name);
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

  async function uploadProfilePhoto(worker: Worker, file: File) {
    setUploadingProfile(true);
    setUploadError("");

    try {
      const compressedFile = await compressImageFile(file, {
        maxWidth: 900,
        maxHeight: 900,
        quality: 0.78,
      });
      const [upload] = await uploadWorkerMedia(worker, [compressedFile], "profile");

      if (!upload?.publicUrl) {
        throw new Error("Supabase did not return a profile photo URL.");
      }

      setDraft((current) =>
        current ? { ...current, profile_photo: upload.publicUrl } : current,
      );
      setNotice(
        `Profile photo uploaded (${formatBytes(file.size)} to ${formatBytes(
          compressedFile.size,
        )}).`,
      );
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploadingProfile(false);
    }
  }

  async function uploadCatalogImages(worker: Worker, files: File[]) {
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
      const uploads = await uploadWorkerMedia(worker, compressedFiles, "portfolio");
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
      setUploadError(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploadingCatalog(false);
    }
  }

  async function persistWorker(worker: Worker, nextDraft: WorkerEditDraft) {
    const selectedSkills = allSpecialties.filter((skill) =>
      nextDraft.selected_skill_ids.includes(skill.id),
    );
    const experienceMonths = normalizeExperienceMonths(
      nextDraft.experience_value,
      nextDraft.experience_unit,
    );

    setSavingWorkerId(worker.id);
    setUploadError("");

    try {
      const response = await fetch("/api/admin/workers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          worker_id: worker.id,
          whatsapp_number: nextDraft.whatsapp_number,
          profile_photo: nextDraft.profile_photo,
          portfolio_urls: portfolioUrlsFromDraft(nextDraft),
          experience_months: experienceMonths,
          years_of_experience: experienceYearsFromMonths(experienceMonths),
          bio: nextDraft.bio,
          primary_role: nextDraft.primary_role,
          location: nextDraft.location,
          selected_skills: selectedSkills,
          availability_status: nextDraft.availability_status,
          listed_publicly: nextDraft.listed_publicly,
          salary_expectation: nextDraft.salary_expectation,
          work_type: nextDraft.work_type,
          headline: nextDraft.headline,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        worker?: Worker;
      } | null;

      if (!response.ok || !body?.worker) {
        throw new Error(body?.error ?? (await readAdminError(response)));
      }

      const mergedWorker: Worker = {
        ...worker,
        ...body.worker,
        verification_documents: worker.verification_documents,
        reference_contacts: worker.reference_contacts,
        internal_notes: worker.internal_notes,
        active_assignment: worker.active_assignment,
        active_booking_count: worker.active_booking_count,
      };

      setWorkers((current) =>
        current.map((item) => (item.id === worker.id ? mergedWorker : item)),
      );
      setSelectedId(worker.id);
      setDraft(createEditDraft(mergedWorker));
      setNotice(`${worker.full_name} was updated.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update worker.");
    } finally {
      setSavingWorkerId("");
    }
  }

  function saveSelectedWorker() {
    if (!selectedWorker || !draft) {
      return;
    }

    void persistWorker(selectedWorker, draft);
  }

  function deactivateWorker(worker: Worker) {
    void persistWorker(worker, {
      ...createEditDraft(worker),
      listed_publicly: false,
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader className="border-b border-[color:var(--border)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Active Workers</CardTitle>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                Compact roster view for listing, availability, specialties, and media.
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
                <option value="all">All specialties</option>
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">All status</option>
                <option value="available">Available</option>
                <option value="reserved">Payment locked</option>
                <option value="hired">Hired</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden border-b border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)] md:grid md:grid-cols-[minmax(220px,1.15fr)_1fr_0.7fr_0.7fr_0.8fr]">
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
                  "grid gap-3 px-3 py-3 md:grid-cols-[minmax(220px,1.15fr)_1fr_0.7fr_0.7fr_0.8fr] md:items-center",
                  selectedWorker?.id === worker.id ? "bg-emerald-50/60" : "bg-white",
                )}
              >
                <button
                  type="button"
                  onClick={() => selectWorker(worker)}
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
                      {worker.primary_role} - {worker.location}
                    </p>
                  </div>
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {worker.skills.slice(0, 4).map((skill) => (
                    <Badge key={skill.id} variant="outline" className="normal-case">
                      {skill.name}
                    </Badge>
                  ))}
                  {worker.skills.length > 4 ? (
                    <Badge variant="outline">+{worker.skills.length - 4}</Badge>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  {formatExperienceMonths(workerExperienceMonths(worker))}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={statusVariant(worker.availability_status)}>
                    {availabilityLabel(worker.availability_status)}
                  </Badge>
                  <Badge variant={worker.listed_publicly ? "verified" : "outline"}>
                    {worker.listed_publicly ? "Listed" : "Hidden"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectWorker(worker)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => deactivateWorker(worker)}
                  >
                    {savingWorkerId === worker.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Power className="h-3.5 w-3.5" />
                    )}
                    Hide
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="border-b border-[color:var(--border)]">
          <CardTitle>Worker Edit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedWorker && draft ? (
            <>
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

              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-md bg-[color:var(--muted)]">
                  {draft.profile_photo ? (
                    <Image
                      src={draft.profile_photo}
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
                    ID: {selectedWorker.id_number || "Locked"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 rounded-md border border-[color:var(--border)] bg-white p-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
                    Full name
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-[color:var(--foreground)]">
                    {selectedWorker.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
                    National ID
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-[color:var(--foreground)]">
                    {selectedWorker.id_number || "Stored privately"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                    Phone Number / WhatsApp
                  </label>
                  <Input
                    value={draft.whatsapp_number}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, whatsapp_number: event.target.value }
                          : current,
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                    Location
                  </label>
                  <Input
                    list="worker-location-options"
                    value={draft.location}
                    onChange={(event) =>
                      setDraft((current) =>
                        current ? { ...current, location: event.target.value } : current,
                      )
                    }
                  />
                  <datalist id="worker-location-options">
                    {locations.map((location) => (
                      <option key={location} value={location} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                    Primary Specialty
                  </label>
                  <Select
                    value={draft.primary_role}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, primary_role: event.target.value }
                          : current,
                      )
                    }
                  >
                    {roles.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                    Availability
                  </label>
                  <Select
                    value={draft.availability_status}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              availability_status:
                                event.target.value as Worker["availability_status"],
                            }
                          : current,
                      )
                    }
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Payment locked</option>
                    <option value="hired">Hired</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                    Experience
                  </label>
                  <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={draft.experience_value}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? { ...current, experience_value: event.target.value }
                            : current,
                        )
                      }
                      aria-label="Experience value"
                    />
                    <Select
                      value={draft.experience_unit}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                experience_unit:
                                  event.target.value as ExperienceUnit,
                              }
                            : current,
                        )
                      }
                      aria-label="Experience unit"
                    >
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </Select>
                  </div>
                  <p className="text-[11px] font-bold text-[color:var(--muted-foreground)]">
                    {formatExperienceMonths(
                      normalizeExperienceMonths(
                        draft.experience_value,
                        draft.experience_unit,
                      ),
                    )}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                    Work Type
                  </label>
                  <Select
                    value={draft.work_type}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, work_type: event.target.value as Worker["work_type"] }
                          : current,
                      )
                    }
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                    Salary Expectation
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={draft.salary_expectation}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, salary_expectation: event.target.value }
                          : current,
                      )
                    }
                  />
                </div>
                <label className="flex items-center justify-between gap-3 self-end rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-sm font-extrabold text-[color:var(--foreground)]">
                  Active listing
                  <input
                    type="checkbox"
                    checked={draft.listed_publicly}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, listed_publicly: event.target.checked }
                          : current,
                      )
                    }
                    className="h-4 w-4 accent-[color:var(--primary)]"
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                  Specialties & Sub-Specialties
                </label>
                <WorkerSpecialtySelector
                  roleCatalog={roleCatalog}
                  selectedSkillIds={draft.selected_skill_ids}
                  onToggleSkill={toggleSkill}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                  Headline
                </label>
                <Input
                  value={draft.headline}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, headline: event.target.value } : current,
                    )
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                  Experience Notes
                </label>
                <Textarea
                  value={draft.bio}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, bio: event.target.value } : current,
                    )
                  }
                />
              </div>

              <div className="space-y-2 rounded-md border border-[color:var(--border)] p-3">
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" />
                  <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                    Profile Photo
                  </p>
                </div>
                <Input
                  value={draft.profile_photo}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? { ...current, profile_photo: event.target.value }
                        : current,
                    )
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
                      void uploadProfilePhoto(selectedWorker, file);
                    }
                  }}
                />
                {uploadingProfile ? (
                  <div className="flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading profile photo...
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 rounded-md border border-[color:var(--border)] p-3">
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" />
                  <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                    Portfolio / Catalog
                  </p>
                </div>
                <Textarea
                  value={draft.portfolio_urls}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? { ...current, portfolio_urls: event.target.value }
                        : current,
                    )
                  }
                  placeholder="One image URL per line"
                />
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploadingCatalog}
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    event.currentTarget.value = "";
                    void uploadCatalogImages(selectedWorker, files);
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

              <div className="space-y-2 rounded-md border border-[color:var(--border)] p-3">
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4" />
                  <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                    Current Booking
                  </p>
                </div>
                <p className="text-sm leading-5 text-[color:var(--muted-foreground)]">
                  {selectedWorker.active_assignment
                    ? `${availabilityLabel(selectedWorker.active_assignment.status === "hired" ? "hired" : "reserved")} on ${selectedWorker.active_assignment.salon_name}`
                    : "No reserved or hired assignment."}
                </p>
                <p className="mt-2 text-sm font-bold text-[color:var(--foreground)]">
                  {activeBookingCountLabel(selectedWorker.active_booking_count)}
                </p>
              </div>

              <div className="space-y-2 rounded-md border border-[color:var(--border)] p-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                    History
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

              <div className="flex flex-col gap-3 border-t border-[color:var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={statusVariant(draft.availability_status)}>
                    {availabilityLabel(draft.availability_status)}
                  </Badge>
                  <Badge variant={draft.listed_publicly ? "verified" : "outline"}>
                    {draft.listed_publicly ? "Listed" : "Hidden"}
                  </Badge>
                  <Badge
                    variant={
                      selectedWorker.verification_status === "verified"
                        ? "verified"
                        : selectedWorker.verification_status === "pending"
                          ? "pending"
                          : "critical"
                    }
                  >
                    {verificationLabel(selectedWorker.verification_status)}
                  </Badge>
                </div>
                <Button
                  disabled={isUploading || isSaving}
                  onClick={saveSelectedWorker}
                >
                  {savingWorkerId === selectedWorker.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {savingWorkerId === selectedWorker.id ? "Saving..." : "Save worker"}
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-md border border-dashed border-[color:var(--border)] p-4 text-sm text-[color:var(--muted-foreground)]">
              Select a worker to edit status, specialties, media, or listing visibility.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
