"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X } from "lucide-react";

import { BookingTrackingSuccess } from "@/components/bookings/booking-tracking-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Worker } from "@/lib/types";

interface WorkerBookingModalProps {
  worker: Worker;
}

interface SingleBookingForm {
  salonName: string;
  contactName: string;
  contactNumber: string;
  location: string;
  preferredStartDate: string;
}

interface BookingSubmissionResult {
  trackingUrl: string;
  trackingToken: string;
}

const initialForm: SingleBookingForm = {
  salonName: "",
  contactName: "",
  contactNumber: "",
  location: "",
  preferredStartDate: "",
};

export function WorkerBookingModal({ worker }: WorkerBookingModalProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState<BookingSubmissionResult | null>(null);
  const [submitError, setSubmitError] = useState("");

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!form.salonName.trim()) nextErrors.salonName = "Salon name is required.";
    if (!form.contactName.trim()) nextErrors.contactName = "Your name is required.";
    if (!form.contactNumber.trim()) {
      nextErrors.contactNumber = "Contact number is required.";
    }
    if (!form.location.trim()) nextErrors.location = "Salon location is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit() {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "worker",
          workerId: worker.id,
          workerName: worker.full_name,
          workerRole: worker.primary_role,
          salonName: form.salonName,
          contactName: form.contactName,
          contactNumber: form.contactNumber,
          location: form.location,
          preferredStartDate: form.preferredStartDate,
        }),
      });
      const result = (await response.json()) as
        | BookingSubmissionResult
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

      setSubmission(result);
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

  function resetAndClose() {
    setOpen(false);
    window.setTimeout(() => {
      setForm(initialForm);
      setErrors({});
      setSubmission(null);
      setSubmitError("");
      setIsSubmitting(false);
    }, 180);
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Request Worker
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end bg-black/35 px-3 py-4 sm:items-center sm:justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-lg bg-white shadow-xl"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-start justify-between gap-3 border-b border-[color:var(--border)] p-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[color:var(--foreground)]">
                    Request {worker.full_name}
                  </h2>
                  <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                    Send a single worker request for Beauty Connect review.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="rounded-md p-2 hover:bg-[color:var(--muted)]"
                  aria-label="Close booking form"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {submission ? (
                <BookingTrackingSuccess
                  trackingToken={submission.trackingToken}
                  trackingUrl={submission.trackingUrl}
                  onClose={resetAndClose}
                  className="p-4"
                />
              ) : (
                <div className="space-y-3 p-4">
                  <ModalField error={errors.salonName} label="Salon Name">
                    <Input
                      value={form.salonName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          salonName: event.target.value,
                        }))
                      }
                    />
                  </ModalField>
                  <ModalField error={errors.contactName} label="Your Name">
                    <Input
                      value={form.contactName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          contactName: event.target.value,
                        }))
                      }
                    />
                  </ModalField>
                  <ModalField
                    error={errors.contactNumber}
                    label="Contact Number / WhatsApp"
                  >
                    <Input
                      value={form.contactNumber}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          contactNumber: event.target.value,
                        }))
                      }
                    />
                  </ModalField>
                  <ModalField error={errors.location} label="Salon Location">
                    <Input
                      value={form.location}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          location: event.target.value,
                        }))
                      }
                    />
                  </ModalField>
                  <ModalField label="Preferred Start Date">
                    <Input
                      type="date"
                      value={form.preferredStartDate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          preferredStartDate: event.target.value,
                        }))
                      }
                    />
                  </ModalField>
                  <Button className="w-full" onClick={submit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      "Creating request..."
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit request
                      </>
                    )}
                  </Button>
                  {submitError ? (
                    <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
                      {submitError}
                    </p>
                  ) : null}
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function ModalField({
  children,
  error,
  label,
}: {
  children: ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-[color:var(--foreground)]">{label}</label>
      {children}
      {error ? <p className="text-xs font-bold text-rose-700">{error}</p> : null}
    </div>
  );
}
