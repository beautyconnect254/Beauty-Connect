"use client";

import { useState } from "react";
import Image from "next/image";
import { Gauge, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { activeBookingCountLabel } from "@/lib/capacity-rules";
import type { Worker, WorkerCapacitySettings } from "@/lib/types";

interface AdminWorkerCapacityClientProps {
  initialSettings: WorkerCapacitySettings;
  workers: Worker[];
}

export function AdminWorkerCapacityClient({
  initialSettings,
  workers,
}: AdminWorkerCapacityClientProps) {
  const [limit, setLimit] = useState(
    String(initialSettings.max_active_bookings_per_worker),
  );
  const [savedLimit, setSavedLimit] = useState(
    initialSettings.max_active_bookings_per_worker,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function saveCapacityLimit() {
    const nextLimit = Math.max(Math.floor(Number(limit) || 0), 1);

    setIsSaving(true);
    setNotice("");

    try {
      const response = await fetch("/api/admin/capacity", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maxActiveBookingsPerWorker: nextLimit,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        settings?: WorkerCapacitySettings;
      } | null;

      if (!response.ok || !body?.settings) {
        throw new Error(body?.error ?? "Could not save worker capacity.");
      }

      setSavedLimit(body.settings.max_active_bookings_per_worker);
      setLimit(String(body.settings.max_active_bookings_per_worker));
      setNotice("Worker capacity rules saved.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not save worker capacity.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader className="border-b border-[color:var(--border)]">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[color:var(--primary)]" />
            <CardTitle>Maximum Simultaneous Active Bookings Per Worker</CardTitle>
          </div>
          <p className="text-sm leading-5 text-[color:var(--muted-foreground)]">
            Pending, confirmed, and paid bookings count as active until the worker
            is completed or released later.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {notice ? (
            <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-sm font-bold text-[color:var(--foreground)]">
              {notice}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_auto] sm:items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[color:var(--foreground)]">
                Active booking limit
              </label>
              <Input
                type="number"
                min="1"
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
              />
            </div>
            <Button disabled={isSaving} onClick={() => void saveCapacityLimit()}>
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save limit"}
            </Button>
          </div>

          <div className="rounded-md border border-[color:var(--border)] bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
              Current rule
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
              Each worker can be assigned to up to {savedLimit} active booking
              {savedLimit === 1 ? "" : "s"}.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="border-b border-[color:var(--border)]">
          <CardTitle>Worker Load</CardTitle>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            Quick scan of current active booking counts.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {workers.slice(0, 10).map((worker) => (
            <div
              key={worker.id}
              className="flex min-w-0 items-center gap-3 rounded-md border border-[color:var(--border)] bg-white p-2"
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
                  {worker.primary_role}
                </p>
              </div>
              <Badge
                variant={
                  worker.active_booking_count >= savedLimit ? "pending" : "outline"
                }
              >
                {activeBookingCountLabel(worker.active_booking_count)}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
