"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TrackingLinkCardProps {
  trackingToken: string | null;
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

export function TrackingLinkCard({ trackingToken }: TrackingLinkCardProps) {
  const [message, setMessage] = useState("");
  const relativeHref = trackingToken ? `/track/${trackingToken}` : "";
  const trackingUrl = relativeHref;

  async function copyLink() {
    if (!trackingUrl) {
      return;
    }

    try {
      const copyValue = `${window.location.origin}${relativeHref}`;

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyValue);
      } else if (!fallbackCopy(copyValue)) {
        throw new Error("Copy failed");
      }

      setMessage("Tracking link copied.");
    } catch {
      setMessage("Could not copy the link.");
    }
  }

  if (!trackingToken) {
    return null;
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
            Tracking link
          </p>
          <Link
            href={relativeHref}
            className="mt-1 flex min-w-0 items-center gap-1 text-sm font-extrabold text-[color:var(--foreground)] underline"
          >
            <span className="truncate">{trackingUrl}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </Link>
          {message ? (
            <p className="mt-1 text-xs font-bold text-emerald-700">{message}</p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={copyLink}>
          <Copy className="h-4 w-4" />
          Copy tracking link
        </Button>
      </CardContent>
    </Card>
  );
}
