"use client";

import Image from "next/image";
import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Worker } from "@/lib/types";

interface AdminFeaturedWorkersClientProps {
  initialWorkers: Worker[];
}

export function AdminFeaturedWorkersClient({
  initialWorkers,
}: AdminFeaturedWorkersClientProps) {
  const [workers, setWorkers] = useState(initialWorkers);
  const featuredWorkers = workers
    .filter((worker) => worker.featured || worker.featured_status === "active")
    .sort((left, right) => right.featured_priority_score - left.featured_priority_score);

  function updateWorker(workerId: string, updates: Partial<Worker>) {
    setWorkers((current) =>
      current.map((worker) =>
        worker.id === workerId ? { ...worker, ...updates } : worker,
      ),
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-[color:var(--border)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <CardTitle>Featured Workers</CardTitle>
        </div>
        <p className="text-sm text-[color:var(--muted-foreground)]">
          Manage promoted workers without changing staffing availability.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="hidden border-b border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-[11px] font-extrabold uppercase text-[color:var(--muted-foreground)] md:grid md:grid-cols-[minmax(220px,1.2fr)_0.7fr_0.7fr_0.7fr_0.7fr]">
          <span>Worker</span>
          <span>Status</span>
          <span>Expires</span>
          <span>Priority</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-[color:var(--border)]">
          {featuredWorkers.map((worker) => (
            <div
              key={worker.id}
              className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(220px,1.2fr)_0.7fr_0.7fr_0.7fr_0.7fr] md:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
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
                    {worker.primary_role}
                  </p>
                </div>
              </div>
              <Select
                value={worker.featured_status}
                onChange={(event) =>
                  updateWorker(worker.id, {
                    featured_status: event.target.value as Worker["featured_status"],
                    featured: event.target.value === "active",
                  })
                }
              >
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="expired">Expired</option>
                <option value="off">Off</option>
              </Select>
              <Input
                type="date"
                value={worker.featured_expires_at ?? ""}
                onChange={(event) =>
                  updateWorker(worker.id, {
                    featured_expires_at: event.target.value || null,
                  })
                }
              />
              <Input
                type="number"
                min="0"
                value={worker.featured_priority_score}
                onChange={(event) =>
                  updateWorker(worker.id, {
                    featured_priority_score: Number(event.target.value),
                  })
                }
              />
              <div className="flex flex-wrap gap-2">
                <Badge variant={worker.listed_publicly ? "verified" : "outline"}>
                  {worker.listed_publicly ? "Listed" : "Internal"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateWorker(worker.id, {
                      featured: false,
                      featured_status: "off",
                    })
                  }
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
