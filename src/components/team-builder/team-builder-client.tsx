"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { BookingTrackingSuccess } from "@/components/bookings/booking-tracking-success";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  readSalonAutofill,
  saveSalonAutofill,
} from "@/lib/salon-autofill";
import type { RoleSpecialtyCatalog, TeamWorkType } from "@/lib/types";
import { cn, totalHeadcount } from "@/lib/utils";

interface TeamBuilderClientProps {
  roleCatalog: RoleSpecialtyCatalog[];
}

interface DraftRequest {
  salon_name: string;
  contact_name: string;
  contact_email: string;
  contact_whatsapp: string;
  location: string;
  work_type: TeamWorkType;
  target_start_date: string;
}

interface DraftRole {
  id: string;
  role: string;
  quantity: number;
  min_experience_amount: number;
  min_experience_unit: "months" | "years";
  specialty_ids: string[];
}

interface BookingSubmissionResult {
  bookingId: string;
  bookingUrl: string;
  trackingUrl: string;
  trackingToken: string;
  submittedAt: string;
}

const steps = [{ label: "Salon Details" }, { label: "Build The Team" }] as const;

const defaultDraft: DraftRequest = {
  salon_name: "",
  contact_name: "",
  contact_email: "",
  contact_whatsapp: "",
  location: "",
  work_type: "long-term-contract",
  target_start_date: "",
};

function mergeDraftWithCachedSalonDetails(current: DraftRequest): DraftRequest {
  const cached = readSalonAutofill();

  return {
    ...current,
    salon_name: current.salon_name || cached.salonName,
    contact_name: current.contact_name || cached.contactName,
    contact_email: current.contact_email || cached.contactEmail,
    contact_whatsapp: current.contact_whatsapp || cached.contactPhone,
    location: current.location || cached.location,
  };
}

function roleId(role: string) {
  return `draft-role-${role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function formatStartDate(date: string) {
  if (!date) {
    return "Not set";
  }

  return format(new Date(`${date}T00:00:00`), "MMM d, yyyy");
}

function experienceMonths(role: DraftRole) {
  return role.min_experience_unit === "years"
    ? role.min_experience_amount * 12
    : role.min_experience_amount;
}

function minExperienceYears(role: DraftRole) {
  return Math.ceil(experienceMonths(role) / 12);
}

function teamWorkTypeLabel(workType: TeamWorkType) {
  return workType === "short-term-contract"
    ? "Short-Term Contract"
    : "Long-Term Contract";
}

function experienceLabel(role: DraftRole) {
  const unit = role.min_experience_unit;
  const amount = role.min_experience_amount;
  const label =
    amount === 1
      ? unit === "years"
        ? "year"
        : "month"
      : unit;

  return `${amount}+ ${label}`;
}

function experienceBand(role: DraftRole) {
  const months = experienceMonths(role);

  if (months <= 6) {
    return {
      label: "Entry value",
      className: "bg-emerald-50 text-emerald-800",
      bar: "w-1/4 bg-emerald-500",
    };
  }

  if (months <= 24) {
    return {
      label: "Standard",
      className: "bg-sky-50 text-sky-800",
      bar: "w-1/2 bg-sky-500",
    };
  }

  if (months <= 60) {
    return {
      label: "Experienced",
      className: "bg-amber-50 text-amber-800",
      bar: "w-3/4 bg-amber-500",
    };
  }

  return {
    label: "Senior",
    className: "bg-violet-50 text-violet-800",
    bar: "w-full bg-violet-500",
  };
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function TeamBuilderClient({ roleCatalog }: TeamBuilderClientProps) {
  const { getAccessToken } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<DraftRequest>(defaultDraft);
  const [roles, setRoles] = useState<DraftRole[]>(
    roleCatalog.map((category) => ({
      id: roleId(category.role),
      role: category.role,
      quantity: 0,
      min_experience_amount: 6,
      min_experience_unit: "months",
      specialty_ids: [],
    })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState<BookingSubmissionResult | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setDraft(mergeDraftWithCachedSalonDetails);
    });
  }, []);

  const selectedRoles = roles.filter((item) => item.quantity > 0);
  const headcount = totalHeadcount(selectedRoles);
  const filteredRoleCatalog = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();

    if (!query) {
      return roleCatalog;
    }

    return roleCatalog.filter(
      (category) =>
        category.role.toLowerCase().includes(query) ||
        category.specialties.some((skill) =>
          skill.name.toLowerCase().includes(query),
        ),
    );
  }, [roleCatalog, roleSearch]);

  const summaryRoles = useMemo(
    () =>
      selectedRoles.map((role) => {
        const catalog = roleCatalog.find((item) => item.role === role.role);
        const specialtyNames =
          catalog?.specialties
            .filter((skill) => role.specialty_ids.includes(skill.id))
            .map((skill) => skill.name) ?? [];

        return {
          role,
          specialtyNames,
        };
      }),
    [roleCatalog, selectedRoles],
  );

  function updateRole(roleIdValue: string, updater: (role: DraftRole) => DraftRole) {
    setRoles((current) =>
      current.map((role) => (role.id === roleIdValue ? updater(role) : role)),
    );
  }

  function validateStepOne() {
    const nextErrors: Record<string, string> = {};

    if (!draft.salon_name.trim()) nextErrors.salon_name = "Salon name is required.";
    if (!draft.contact_name.trim()) nextErrors.contact_name = "Your name is required.";
    if (draft.contact_email.trim() && !validateEmail(draft.contact_email)) {
      nextErrors.contact_email = "Use a valid email address.";
    }
    if (!draft.contact_whatsapp.trim()) {
      nextErrors.contact_whatsapp = "Phone or WhatsApp is required.";
    }
    if (!draft.location.trim()) nextErrors.location = "Salon location is required.";
    if (!draft.target_start_date) {
      nextErrors.target_start_date = "Target start date is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
    if (stepIndex === 0 && !validateStepOne()) {
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submitRequest() {
    const nextErrors: Record<string, string> = {};

    if (!validateStepOne()) {
      setStepIndex(0);
      return;
    }

    if (selectedRoles.length === 0) {
      nextErrors.roles = "Choose at least one role.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const accessToken = getAccessToken();
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          type: "team",
          salonName: draft.salon_name,
          contactName: draft.contact_name,
          contactEmail: draft.contact_email,
          contactWhatsapp: draft.contact_whatsapp,
          location: draft.location,
          workType: draft.work_type,
          targetStartDate: draft.target_start_date,
          roles: summaryRoles.map(({ role, specialtyNames }) => ({
            role: role.role,
            quantity: role.quantity,
            minExperience: minExperienceYears(role),
            minExperienceMonths: experienceMonths(role),
            experienceLabel: experienceLabel(role),
            specialtyIds: role.specialty_ids,
            specialtyNames,
          })),
        }),
      });
      const result = (await response.json()) as
        | Omit<BookingSubmissionResult, "submittedAt">
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in result
            ? result.error ?? "Could not submit booking."
            : "Could not submit booking.",
        );
      }

      if (!("trackingUrl" in result)) {
        throw new Error("Could not submit booking.");
      }

      setSubmission({
        ...result,
        submittedAt: new Date().toISOString(),
      });
      saveSalonAutofill({
        salonName: draft.salon_name,
        contactName: draft.contact_name,
        contactEmail: draft.contact_email,
        contactPhone: draft.contact_whatsapp,
        location: draft.location,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not submit booking. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-4">
      <Card>
        <CardHeader className="space-y-3 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">
              {steps[stepIndex].label}
            </CardTitle>
            <Badge variant="outline">
              Step {stepIndex + 1} of {steps.length}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {steps.map((step, index) => (
              <button
                key={step.label}
                type="button"
                onClick={() => {
                  if (index === 1 && !validateStepOne()) return;
                  setStepIndex(index);
                }}
                className={cn(
                  "rounded-md border px-3 py-2 text-left text-xs font-extrabold transition",
                  stepIndex === index
                    ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-white"
                    : "border-[color:var(--border)] bg-white text-[color:var(--muted-foreground)]",
                )}
              >
                {step.label}
              </button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {stepIndex === 0 ? (
        <Card>
          <CardContent className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4">
            <FieldError error={errors.salon_name}>
              <label className="text-xs font-bold text-[color:var(--foreground)]">
                Salon Name
              </label>
              <Input
                value={draft.salon_name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, salon_name: event.target.value }))
                }
                placeholder="Luna House Salon"
              />
            </FieldError>
            <FieldError error={errors.contact_name}>
              <label className="text-xs font-bold text-[color:var(--foreground)]">
                Your Name
              </label>
              <Input
                value={draft.contact_name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, contact_name: event.target.value }))
                }
                placeholder="Martha Wainaina"
              />
            </FieldError>
            <FieldError error={errors.contact_email}>
              <label className="text-xs font-bold text-[color:var(--foreground)]">
                Contact Email (optional)
              </label>
              <Input
                type="email"
                value={draft.contact_email}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, contact_email: event.target.value }))
                }
                placeholder="name@salon.com"
              />
            </FieldError>
            <FieldError error={errors.contact_whatsapp}>
              <label className="text-xs font-bold text-[color:var(--foreground)]">
                Phone Number / WhatsApp
              </label>
              <Input
                value={draft.contact_whatsapp}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    contact_whatsapp: event.target.value,
                  }))
                }
                placeholder="+254 700 000 000"
              />
            </FieldError>
            <FieldError error={errors.location}>
              <label className="text-xs font-bold text-[color:var(--foreground)]">
                Salon Location
              </label>
              <Input
                value={draft.location}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, location: event.target.value }))
                }
                placeholder="Nairobi"
              />
            </FieldError>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[color:var(--foreground)]">
                Preferred Work Type
              </label>
              <Select
                value={draft.work_type}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    work_type: event.target.value as TeamWorkType,
                  }))
                }
              >
                <option value="long-term-contract">Long-Term Contract</option>
                <option value="short-term-contract">Short-Term Contract</option>
              </Select>
            </div>
            <FieldError error={errors.target_start_date}>
              <label className="text-xs font-bold text-[color:var(--foreground)]">
                Target Start Date
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
            </FieldError>
          </CardContent>
        </Card>
      ) : null}

      {stepIndex === 1 ? (
        <div className="space-y-3">
          <Card>
            <CardHeader className="space-y-3 p-3 sm:p-4">
              <div>
                <CardTitle className="text-base">Search</CardTitle>
                <p className="mt-1 text-sm leading-5 text-[color:var(--muted-foreground)]">
                  Search for a role or service, then tap a specialty to set quantity,
                  experience, and sub-specialties.
                </p>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[color:var(--muted-foreground)]" />
                <Input
                  value={roleSearch}
                  onChange={(event) => setRoleSearch(event.target.value)}
                  placeholder="Search barber, braiding, wig installation..."
                  className="pl-9"
                />
              </div>
            </CardHeader>
          </Card>

          {errors.roles ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
              {errors.roles}
            </p>
          ) : null}

          <div className="grid gap-3">
            {filteredRoleCatalog.map((category) => {
              const roleDraft = roles.find((role) => role.role === category.role);

              if (!roleDraft) return null;

              const band = experienceBand(roleDraft);
              const expanded = expandedRoleId === roleDraft.id;
              const selectedSpecialties = category.specialties.filter((skill) =>
                roleDraft.specialty_ids.includes(skill.id),
              );

              return (
                <Card key={category.role} className="overflow-hidden">
                  <CardContent className="space-y-3 p-3 sm:p-4">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedRoleId((current) =>
                          current === roleDraft.id ? null : roleDraft.id,
                        )
                      }
                      className="flex w-full items-center justify-between gap-3 text-left"
                      aria-expanded={expanded}
                    >
                      <div className="min-w-0">
                        <h3 className="text-base font-extrabold leading-tight text-[color:var(--foreground)]">
                          {category.role === "Hair Stylist"
                            ? "Hairstylist"
                            : category.role}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge variant={roleDraft.quantity > 0 ? "verified" : "outline"}>
                            Qty {roleDraft.quantity}
                          </Badge>
                          <Badge variant="outline">
                            {selectedSpecialties.length} sub-specialt
                            {selectedSpecialties.length === 1 ? "y" : "ies"}
                          </Badge>
                          <Badge variant="outline">{experienceLabel(roleDraft)}</Badge>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 text-[color:var(--muted-foreground)] transition",
                          expanded ? "rotate-180" : "",
                        )}
                      />
                    </button>

                    {expanded ? (
                      <div className="space-y-4 border-t border-[color:var(--border)] pt-3">
                        <div className="flex items-center justify-between gap-3 rounded-md bg-[color:var(--muted)] p-2">
                          <p className="text-xs font-extrabold text-[color:var(--foreground)]">
                            Workers needed
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-[color:var(--border)] bg-white"
                              onClick={() =>
                                updateRole(roleDraft.id, (current) => ({
                                  ...current,
                                  quantity: Math.max(0, current.quantity - 1),
                                }))
                              }
                              aria-label={`Reduce ${category.role} quantity`}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <div className="w-10 text-center">
                              <p className="text-[10px] font-bold uppercase text-[color:var(--muted-foreground)]">
                                Qty
                              </p>
                              <p className="text-lg font-extrabold">{roleDraft.quantity}</p>
                            </div>
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--primary)] text-white"
                              onClick={() =>
                                updateRole(roleDraft.id, (current) => ({
                                  ...current,
                                  quantity: current.quantity + 1,
                                }))
                              }
                              aria-label={`Increase ${category.role} quantity`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-bold text-[color:var(--foreground)]">
                            Sub-Specialties
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {category.specialties.map((skill) => {
                              const active = roleDraft.specialty_ids.includes(skill.id);

                              return (
                                <button
                                  key={skill.id}
                                  type="button"
                                  onClick={() =>
                                    updateRole(roleDraft.id, (current) => ({
                                      ...current,
                                      specialty_ids: active
                                        ? current.specialty_ids.filter(
                                            (item) => item !== skill.id,
                                          )
                                        : [...current.specialty_ids, skill.id],
                                    }))
                                  }
                                  className={cn(
                                    "rounded-full border px-2.5 py-1.5 text-xs font-bold transition",
                                    active
                                      ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-white"
                                      : "border-[color:var(--border)] bg-white text-[color:var(--foreground)]",
                                  )}
                                >
                                  {skill.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-[color:var(--foreground)]">
                              Minimum Experience
                            </p>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                                band.className,
                              )}
                            >
                              {band.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-[1fr_1fr] gap-2">
                            <Select
                              value={String(roleDraft.min_experience_amount)}
                              onChange={(event) =>
                                updateRole(roleDraft.id, (current) => ({
                                  ...current,
                                  min_experience_amount: Number(event.target.value),
                                }))
                              }
                            >
                              {[1, 3, 6, 12].map((month) => (
                                <option key={`m-${month}`} value={month}>
                                  {month}
                                </option>
                              ))}
                            </Select>
                            <Select
                              value={roleDraft.min_experience_unit}
                              onChange={(event) =>
                                updateRole(roleDraft.id, (current) => ({
                                  ...current,
                                  min_experience_unit: event.target
                                    .value as DraftRole["min_experience_unit"],
                                  min_experience_amount:
                                    event.target.value === "years" &&
                                    current.min_experience_amount > 10
                                      ? 1
                                      : current.min_experience_amount,
                                }))
                              }
                            >
                              <option value="months">Months</option>
                              <option value="years">Years</option>
                            </Select>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--muted)]">
                            <div className={cn("h-full rounded-full", band.bar)} />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
            {filteredRoleCatalog.length === 0 ? (
              <div className="rounded-md border border-dashed border-[color:var(--border)] bg-white p-4 text-sm font-semibold text-[color:var(--muted-foreground)]">
                No roles or sub-specialties match that search.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="sticky bottom-0 z-20 -mx-3 border-t border-[color:var(--border)] bg-[color:var(--background)]/95 px-3 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <Card>
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
                Request
              </p>
              <p className="truncate text-sm font-extrabold text-[color:var(--foreground)]">
                {headcount > 0
                  ? `${headcount} worker${headcount === 1 ? "" : "s"} requested`
                  : "No roles selected"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                variant="outline"
                onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
                disabled={stepIndex === 0 || isSubmitting}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              {stepIndex === 0 ? (
                <Button onClick={goNext}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={submitRequest} disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        {submitError ? (
          <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
            {submitError}
          </p>
        ) : null}
      </div>

      <AnimatePresence>
        {submission ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end bg-black/35 px-3 py-4 sm:items-center sm:justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg rounded-lg bg-white shadow-xl"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-start justify-between gap-3 border-b border-[color:var(--border)] p-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[color:var(--foreground)]">
                    Request sent
                  </h2>
                  <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                    Your team request is saved to your account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmission(null)}
                  className="rounded-md p-2 hover:bg-[color:var(--muted)]"
                  aria-label="Close summary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 p-4">
                <BookingTrackingSuccess
                  trackingToken={submission.trackingToken}
                  trackingUrl={submission.trackingUrl}
                  bookingUrl={submission.bookingUrl}
                  onClose={() => setSubmission(null)}
                />
                <div className="rounded-md border border-[color:var(--border)] p-3">
                  <div className="mb-3 grid gap-2 sm:grid-cols-3">
                    <SummaryRow label="Salon" value={draft.salon_name} />
                    <SummaryRow
                      label="Work type"
                      value={teamWorkTypeLabel(draft.work_type)}
                    />
                    <SummaryRow
                      label="Start date"
                      value={formatStartDate(draft.target_start_date)}
                    />
                  </div>
                  <p className="text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
                    Requested roles
                  </p>
                  <div className="mt-2 space-y-2">
                    {summaryRoles.map(({ role, specialtyNames }) => (
                      <div key={role.id} className="text-sm">
                        <p className="font-extrabold text-[color:var(--foreground)]">
                          {role.quantity} x {role.role} - {experienceLabel(role)}
                        </p>
                        <p className="text-xs text-[color:var(--muted-foreground)]">
                          {specialtyNames.length > 0
                            ? specialtyNames.join(", ")
                            : "No specialities selected"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Submitted {format(new Date(submission.submittedAt), "MMM d, yyyy")}
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function FieldError({
  children,
  error,
}: {
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      {children}
      {error ? <p className="text-xs font-bold text-rose-700">{error}</p> : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-[color:var(--muted)] px-3 py-2">
      <p className="text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
        {label}
      </p>
      <p className="text-sm font-extrabold text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
