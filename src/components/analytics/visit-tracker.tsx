"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISIT_SESSION_KEY = "bc-visit-session";

function getVisitSessionId() {
  const existing = window.localStorage.getItem(VISIT_SESSION_KEY);

  if (existing) {
    return existing;
  }

  const next =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(VISIT_SESSION_KEY, next);
  return next;
}

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      return;
    }

    const path = `${pathname}${window.location.search}`;

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path,
        sessionId: getVisitSessionId(),
        referrer: document.referrer,
      }),
      keepalive: true,
    }).catch(() => null);
  }, [pathname]);

  return null;
}
