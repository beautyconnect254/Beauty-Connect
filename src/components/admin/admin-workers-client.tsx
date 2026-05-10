"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ImagePlus,
  PlusCircle,
  Save,
  ShieldCheck,
  UserRoundPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  SkillRecord,
  VerificationDocumentStatus,
  Worker,
  WorkerRole,
} from "@/lib/types";
import { availabilityLabel, cn, verificationLabel } from "@/lib/utils";

interface AdminWorkersClientProps {
  initialWorkers: Worker[];
  roles: WorkerRole[];
  locations: string[];
  skillCatalog: SkillRecord[];
}

interface DocumentDraft {
  id: string;
  document_type: string;
  status: VerificationDocumentStatus;
  file_url: string;
}

interface WorkerDraft {
  id?: string;
  full_name: string;
  primary_role: WorkerRole;
  profile_photo: string;
  location: string;
  years_of_experience: string;
  bio: string;
  availability_status: Worker["availability_status"];
  verification_status: Worker["verification_status"];
  salary_expectation: string;
  work_type: Worker["work_type"];
  whatsapp_number: string;
  headline: string;
  featured_status: Worker["featured_status"];
  featured_expires_at: string;
  featured_frequency: string;
  featured_priority_score: string;
  listed_publicly: boolean;
  selected_skill_ids: string[];
  portfolio_urls: string[];
  documents: DocumentDraft[];
  reference_name: string;
  reference_phone: string;
  reference_relationship: string;
  previous_workplace: string;
  internal_note: string;
}

const steps = [
  { id: "personal", label: "Personal", icon: UserRoundPlus },
  { id: "skills", label: "Skills", icon: Users },
  { id: "portfolio", label: "Portfolio", icon: ImagePlus },
  { id: "verification", label: "Verification", icon: ShieldCheck },
  { id: "availability", label: "Availability", icon: FileText },
] as const;

function createDraft(worker?: Worker): WorkerDraft {
  const primaryReference = worker?.reference_contacts[0];

  return {
    id: worker?.id,
    full_name: worker?.full_name ?? "",
    primary_role: worker?.primary_role ?? "Hair Stylist",
    profile_photo: worker?.profile_photo ?? "",
    location: worker?.location ?? "Nairobi",
    years_of_experience: String(worker?.years_of_experience ?? 2),
    bio: worker?.bio ?? "",
    availability_status: worker?.availability_status ?? "available",
    verification_status: worker?.verification_status ?? "pending",
    salary_expectation: String(worker?.salary_expectation ?? 50000),
    work_type: worker?.work_type ?? "full-time",
    whatsapp_number: worker?.whatsapp_number ?? "",
    headline: worker?.headline ?? "",
    featured_status: worker?.featured_status ?? "off",
    featured_expires_at: worker?.featured_expires_at ?? "",
    featured_frequency: String(worker?.featured_frequency ?? 0),
    featured_priority_score: String(worker?.featured_priority_score ?? 0),
    listed_publicly: worker?.listed_publicly ?? false,
    selected_skill_ids: worker?.skills.map((skill) => skill.id) ?? [],
    portfolio_urls: worker?.portfolio.map((item) => item.image_url) ?? [],
    documents:
      worker?.verification_documents.map((document, index) => ({
        id: `${worker.id}-document-${index}`,
        document_type: document.document_type,
        status: document.status,
        file_url: document.file_url,
      })) ?? [],
    reference_name: primaryReference?.contact_name ?? "",
    reference_phone: primaryReference?.contact_phone ?? "",
    reference_relationship: primaryReference?.relationship ?? "",
    previous_workplace: primaryReference?.previous_workplace ?? "",
    internal_note: worker?.internal_notes[0]?.note ?? "",
  };
}

function stepComplete(stepId: (typeof steps)[number]["id"], draft: WorkerDraft) {
  switch (stepId) {
    case "personal":
      return Boolean(
        draft.full_name &&
          draft.profile_photo &&
          draft.location &&
          draft.bio &&
          draft.whatsapp_number,
      );
    case "skills":
      return draft.selected_skill_ids.length > 0;
    case "portfolio":
      return draft.portfolio_urls.length > 0;
    case "verification":
      return Boolean(
        draft.reference_name &&
          draft.reference_phone &&
          draft.previous_workplace &&
          draft.documents.length > 0,
      );
    case "availability":
      return Boolean(draft.salary_expectation && draft.work_type);
    default:
      return false;
  }
}

export function AdminWorkersClient({
  initialWorkers,
  roles,
  locations,
  skillCatalog,
}: AdminWorkersClientProps) {
  const [workers, setWorkers] = useState(initialWorkers);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialWorkers[0]?.id ?? null,
  );
  const [draft, setDraft] = useState(createDraft(initialWorkers[0]));
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [lastSavedLabel, setLastSavedLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      portfolioPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [portfolioPreviews]);

  const selectedWorker = workers.find((worker) => worker.id === selectedId) ?? null;
  const skillsForRole = useMemo(
    () => skillCatalog.filter((skill) => skill.role === draft.primary_role),
    [draft.primary_role, skillCatalog],
  );
  const completionCount = steps.filter((step) => stepComplete(step.id, draft)).length;

  function switchToWorker(worker: Worker) {
    setSelectedId(worker.id);
    setDraft(createDraft(worker));
    setPortfolioPreviews([]);
    setStepIndex(0);
    setLastSavedLabel("");
  }

  function resetToNew() {
    setSelectedId(null);
    setDraft(createDraft());
    setPortfolioPreviews([]);
    setStepIndex(0);
    setLastSavedLabel("");
  }

  function toggleSkill(skillId: string) {
    setDraft((current) => ({
      ...current,
      selected_skill_ids: current.selected_skill_ids.includes(skillId)
        ? current.selected_skill_ids.filter((item) => item !== skillId)
        : [...current.selected_skill_ids, skillId],
    }));
  }

  function addDocument() {
    setDraft((current) => ({
      ...current,
      documents: [
        ...current.documents,
        {
          id: `draft-document-${Date.now().toString(36)}`,
          document_type: "",
          status: "pending",
          file_url: "",
        },
      ],
    }));
  }

  function updateDocument(
    documentId: string,
    field: keyof DocumentDraft,
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      documents: current.documents.map((document) =>
        document.id === documentId
          ? {
              ...document,
              [field]:
                field === "status"
                  ? (value as VerificationDocumentStatus)
                  : value,
            }
          : document,
      ),
    }));
  }

  function removeDocument(documentId: string) {
    setDraft((current) => ({
      ...current,
      documents: current.documents.filter((document) => document.id !== documentId),
    }));
  }

  function saveWorker() {
    const id =
      draft.id ??
      `${draft.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
    const existingWorker = workers.find((worker) => worker.id === id);
    const portfolioUrls = [...draft.portfolio_urls, ...portfolioPreviews];
    const selectedSkills = skillCatalog.filter((skill) =>
      draft.selected_skill_ids.includes(skill.id),
    );
    const canListPublicly =
      draft.verification_status === "verified" && draft.listed_publicly;

    const nextWorker: Worker = {
      id,
      full_name: draft.full_name,
      primary_role: draft.primary_role,
      profile_photo: draft.profile_photo || selectedWorker?.profile_photo || "",
      location: draft.location,
      years_of_experience: Number(draft.years_of_experience),
      bio: draft.bio,
      availability_status: draft.availability_status,
      verification_status: draft.verification_status,
      salary_expectation: Number(draft.salary_expectation),
      work_type: draft.work_type,
      whatsapp_number: draft.whatsapp_number,
      headline: draft.headline,
      featured: draft.featured_status === "active",
      featured_status: draft.featured_status,
      featured_expires_at: draft.featured_expires_at || null,
      featured_frequency: Number(draft.featured_frequency),
      featured_priority_score: Number(draft.featured_priority_score),
      listed_publicly: canListPublicly,
      skills: selectedSkills,
      portfolio: portfolioUrls.map((imageUrl, index) => ({
        id: `${id}-portfolio-${index}`,
        worker_id: id,
        image_url: imageUrl,
        caption: `Portfolio item ${index + 1}`,
        is_cover: index === 0,
      })),
      verification_documents: draft.documents
        .filter((document) => document.document_type || document.file_url)
        .map((document, index) => ({
          id: `${id}-verification-${index}`,
          worker_id: id,
          document_type: document.document_type || "Verification document",
          status: document.status,
          file_url: document.file_url || "https://storage.example.com/pending-upload",
          uploaded_at: new Date().toISOString(),
        })),
      reference_contacts:
        draft.reference_name || draft.reference_phone || draft.previous_workplace
          ? [
              {
                id: `${id}-reference-primary`,
                worker_id: id,
                contact_name: draft.reference_name,
                contact_phone: draft.reference_phone,
                relationship: draft.reference_relationship,
                previous_workplace: draft.previous_workplace,
              },
            ]
          : [],
      internal_notes: draft.internal_note
        ? [
            {
              id: `${id}-note-primary`,
              worker_id: id,
              team_request_id: null,
              staffing_assignment_id: null,
              author: "Admin",
              note: draft.internal_note,
              created_at: new Date().toISOString(),
            },
          ]
        : [],
      active_assignment: existingWorker?.active_assignment ?? null,
    };

    startTransition(() => {
      setWorkers((current) => {
        const alreadyExists = current.some((worker) => worker.id === id);

        if (alreadyExists) {
          return current.map((worker) => (worker.id === id ? nextWorker : worker));
        }

        return [nextWorker, ...current];
      });

      setSelectedId(id);
      setDraft(createDraft(nextWorker));
      setPortfolioPreviews([]);
      setLastSavedLabel(`Saved ${nextWorker.full_name} to the staffing roster.`);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="h-fit xl:sticky xl:top-28">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Internal roster</CardTitle>
            <Button variant="secondary" size="sm" onClick={resetToNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New worker
            </Button>
          </div>
          <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
            Manual recruitment only. Workers are onboarded internally, verified,
            then optionally listed for salon owners.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {workers.map((worker) => (
            <button
              key={worker.id}
              type="button"
              onClick={() => switchToWorker(worker)}
              className={cn(
                "w-full rounded-[24px] border p-4 text-left transition",
                selectedId === worker.id
                  ? "border-[color:var(--primary)] bg-[color:var(--secondary)]"
                  : "border-[color:var(--border)] bg-white/70 hover:bg-[color:var(--secondary)]/60",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-[color:var(--secondary)]">
                  {worker.profile_photo ? (
                    <Image
                      src={worker.profile_photo}
                      alt={worker.full_name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[color:var(--foreground)]">
                    {worker.full_name}
                  </p>
                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    {worker.primary_role} · {worker.location}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge
                  variant={
                    worker.verification_status === "verified"
                      ? "verified"
                      : worker.verification_status === "pending"
                        ? "pending"
                        : "critical"
                  }
                >
                  {verificationLabel(worker.verification_status)}
                </Badge>
                <Badge variant="outline">{availabilityLabel(worker.availability_status)}</Badge>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>
                {selectedWorker ? "Worker onboarding flow" : "Create worker onboarding record"}
              </CardTitle>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted-foreground)]">
                Capture recruitment details once, then move through skills,
                portfolio, verification, and availability before the worker enters
                live staffing operations.
              </p>
            </div>
            <div className="rounded-[24px] bg-[color:var(--secondary)] px-4 py-3 text-sm">
              <p className="font-semibold text-[color:var(--foreground)]">
                {completionCount} of {steps.length} steps ready
              </p>
              <p className="mt-1 text-[color:var(--muted-foreground)]">
                Public listing unlocks only after verification.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === stepIndex;
              const isComplete = stepComplete(step.id, draft);

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setStepIndex(index)}
                  className={cn(
                    "flex items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition",
                    isActive
                      ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                      : "border-[color:var(--border)] bg-white/70 text-[color:var(--foreground)]",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      isActive
                        ? "bg-white/20"
                        : "bg-[color:var(--secondary)] text-[color:var(--primary)]",
                    )}
                  >
                    {isComplete && !isActive ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{step.label}</p>
                    <p
                      className={cn(
                        "text-xs",
                        isActive ? "text-white/70" : "text-[color:var(--muted-foreground)]",
                      )}
                    >
                      Step {index + 1}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {stepIndex === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Full name
                </label>
                <Input
                  value={draft.full_name}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, full_name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Primary role
                </label>
                <Select
                  value={draft.primary_role}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      primary_role: event.target.value as WorkerRole,
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Location
                </label>
                <Select
                  value={draft.location}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, location: event.target.value }))
                  }
                >
                  {Array.from(new Set([...locations, "Nakuru", "Eldoret"])).map(
                    (location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ),
                  )}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Years of experience
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
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Profile photo URL
                </label>
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
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Headline
                </label>
                <Input
                  value={draft.headline}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, headline: event.target.value }))
                  }
                  placeholder="Short internal summary for staffing reviews"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  WhatsApp number
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
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Bio
                </label>
                <Textarea
                  value={draft.bio}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, bio: event.target.value }))
                  }
                  placeholder="Operational summary of strengths, service style, and client fit."
                />
              </div>
            </div>
          ) : null}

          {stepIndex === 1 ? (
            <div className="space-y-5">
              <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  Select skills for {draft.primary_role}
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                  These skills power staffing recommendations, workforce matching,
                  and role-specific booking decisions.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {skillsForRole.map((skill) => {
                  const active = draft.selected_skill_ids.includes(skill.id);

                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition",
                        active
                          ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                          : "border-[color:var(--border)] bg-white text-[color:var(--foreground)]",
                      )}
                    >
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {stepIndex === 2 ? (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--foreground)]">
                    Portfolio image URLs
                  </label>
                  <Textarea
                    value={draft.portfolio_urls.join("\n")}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        portfolio_urls: event.target.value
                          .split("\n")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="One portfolio image URL per line"
                    className="min-h-40"
                  />
                </div>
                <div className="space-y-3 rounded-[26px] border border-dashed border-[color:var(--border)] p-5">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">
                      Upload previews
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--muted-foreground)]">
                      Local preview only until Supabase Storage is connected.
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      portfolioPreviews.forEach((url) => URL.revokeObjectURL(url));
                      const files = Array.from(event.target.files ?? []);
                      setPortfolioPreviews(
                        files.map((file) => URL.createObjectURL(file)),
                      );
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[...draft.portfolio_urls, ...portfolioPreviews].map((imageUrl) => (
                  <div
                    key={imageUrl}
                    className="relative aspect-square overflow-hidden rounded-[22px] bg-[color:var(--secondary)]"
                  >
                    <Image
                      src={imageUrl}
                      alt="Portfolio preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {stepIndex === 3 ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--foreground)]">
                    Verification status
                  </label>
                  <Select
                    value={draft.verification_status}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        verification_status: event.target.value as Worker["verification_status"],
                        listed_publicly:
                          event.target.value === "verified"
                            ? current.listed_publicly
                            : false,
                      }))
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                </div>
                <label className="flex items-center justify-between gap-4 rounded-[24px] bg-[color:var(--secondary)] px-4 py-3 text-sm font-medium text-[color:var(--foreground)] md:mt-7">
                  List publicly after verification
                  <input
                    type="checkbox"
                    checked={draft.listed_publicly && draft.verification_status === "verified"}
                    disabled={draft.verification_status !== "verified"}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        listed_publicly: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[color:var(--primary)]"
                  />
                </label>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--foreground)]">
                    Previous workplace
                  </label>
                  <Input
                    value={draft.previous_workplace}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        previous_workplace: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--foreground)]">
                    Reference contact name
                  </label>
                  <Input
                    value={draft.reference_name}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        reference_name: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--foreground)]">
                    Reference phone
                  </label>
                  <Input
                    value={draft.reference_phone}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        reference_phone: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--foreground)]">
                    Relationship
                  </label>
                  <Input
                    value={draft.reference_relationship}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        reference_relationship: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-[color:var(--foreground)]">
                    Verification documents
                  </p>
                  <Button variant="secondary" size="sm" onClick={addDocument}>
                    Add document
                  </Button>
                </div>
                <div className="space-y-3">
                  {draft.documents.map((document) => (
                    <div
                      key={document.id}
                      className="grid gap-3 rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4 md:grid-cols-[1.1fr_0.6fr_1.3fr_auto]"
                    >
                      <Input
                        value={document.document_type}
                        onChange={(event) =>
                          updateDocument(document.id, "document_type", event.target.value)
                        }
                        placeholder="Document type"
                      />
                      <Select
                        value={document.status}
                        onChange={(event) =>
                          updateDocument(document.id, "status", event.target.value)
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </Select>
                      <Input
                        value={document.file_url}
                        onChange={(event) =>
                          updateDocument(document.id, "file_url", event.target.value)
                        }
                        placeholder="File URL"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-center"
                        onClick={() => removeDocument(document.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Internal notes
                </label>
                <Textarea
                  value={draft.internal_note}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      internal_note: event.target.value,
                    }))
                  }
                  placeholder="Verification findings, client-fit comments, or risk notes."
                />
              </div>
            </div>
          ) : null}

          {stepIndex === 4 ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--foreground)]">
                    Availability status
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
                    <option value="unavailable">Unavailable</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--foreground)]">
                    Work type
                  </label>
                  <Select
                    value={draft.work_type}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        work_type: event.target.value as Worker["work_type"],
                      }))
                    }
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--foreground)]">
                    Salary expectation
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={draft.salary_expectation}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        salary_expectation: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                    Current staffing state
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                    {selectedWorker?.active_assignment
                      ? `${availabilityLabel(selectedWorker.active_assignment.status === "hired" ? "hired" : "reserved")} on ${selectedWorker.active_assignment.salon_name}`
                      : `${availabilityLabel(draft.availability_status)} with no active request link`}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4">
                <p className="font-semibold text-[color:var(--foreground)]">
                  Operational note
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                  In production, reserved and hired states should normally be set by
                  staffing assignments rather than manual edits. This screen keeps the
                  state editable for V1 admin workflow demos.
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-4 rounded-[28px] bg-[color:var(--secondary)] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
                disabled={stepIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setStepIndex((current) => Math.min(current + 1, steps.length - 1))
                }
                disabled={stepIndex === steps.length - 1}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {lastSavedLabel ? (
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  {lastSavedLabel}
                </p>
              ) : null}
              <Button
                onClick={saveWorker}
                disabled={isPending || !draft.full_name}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isPending ? "Saving..." : "Save worker"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
