"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Copy, MessageCircle } from "lucide-react";

import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookingTrackingSuccessProps {
  trackingUrl: string;
  trackingToken: string;
  onClose?: () => void;
  className?: string;
}

function whatsappHref(trackingUrl: string) {
  const message = `Beauty Connect Booking\n\nTrack your booking here:\n${trackingUrl}`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  return copied;
}

export function BookingTrackingSuccess({
  trackingUrl,
  trackingToken,
  onClose,
  className,
}: BookingTrackingSuccessProps) {
  const [copyMessage, setCopyMessage] = useState("");

  async function copyTrackingLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(trackingUrl);
      } else if (!fallbackCopy(trackingUrl)) {
        throw new Error("Copy failed");
      }

      setCopyMessage("Copied. Save it somewhere safe.");
    } catch {
      setCopyMessage("Could not copy. Long press the link and copy it.");
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
        <div className="flex gap-2">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-extrabold">Booking submitted successfully.</p>
            <p className="mt-1 text-sm leading-5">
              Save this tracking link somewhere safe so you can track your
              booking later.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-[color:var(--border)] bg-white p-3">
        <p className="text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
          Tracking link
        </p>
        <Link
          href={`/track/${trackingToken}`}
          className="mt-1 block break-all text-sm font-extrabold text-[color:var(--foreground)] underline"
        >
          {trackingUrl}
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" onClick={copyTrackingLink}>
          <Copy className="h-4 w-4" />
          Copy link
        </Button>
        <a
          href={whatsappHref(trackingUrl)}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "secondary" }), "h-10")}
        >
          <MessageCircle className="h-4 w-4" />
          Save to WhatsApp
        </a>
      </div>

      {copyMessage ? (
        <p className="rounded-md bg-[color:var(--muted)] px-3 py-2 text-sm font-bold text-[color:var(--foreground)]">
          {copyMessage}
        </p>
      ) : null}

      <div className={cn("grid gap-2", onClose ? "grid-cols-2" : "grid-cols-1")}>
        {onClose ? (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        ) : null}
        <Link
          href={`/track/${trackingToken}`}
          className={cn(buttonVariants(), "h-10 w-full")}
        >
          Track booking
        </Link>
      </div>
    </div>
  );
}
