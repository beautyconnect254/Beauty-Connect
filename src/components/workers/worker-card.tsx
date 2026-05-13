"use client";

import Image from "next/image";
import Link from "next/link";
import { BriefcaseBusiness, CheckCircle2, MapPin } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatExperienceMonths, workerExperienceMonths } from "@/lib/experience";
import type { Worker, WorkerRole } from "@/lib/types";
import { availabilityLabel, cn, verificationLabel } from "@/lib/utils";

interface WorkerCardProps {
  worker: Worker;
  compact?: boolean;
}

function roleLabel(role: WorkerRole) {
  return role === "Hair Stylist" ? "Hairstylist" : role;
}

function verificationVariant(status: Worker["verification_status"]) {
  switch (status) {
    case "verified":
      return "verified";
    case "pending":
      return "pending";
    default:
      return "critical";
  }
}

function availabilityClass(status: Worker["availability_status"]) {
  switch (status) {
    case "available":
      return "bg-emerald-100 text-emerald-800";
    case "reserved":
      return "bg-amber-100 text-amber-800";
    case "hired":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-rose-100 text-rose-800";
  }
}

export function WorkerCard({ worker, compact = false }: WorkerCardProps) {
  return (
    <motion.div
      className="h-full min-w-0"
      whileHover={{ y: compact ? -2 : -3 }}
      transition={{ duration: 0.16 }}
    >
      <Card className="h-full min-w-0 overflow-hidden">
        <Link
          href={`/workers/${worker.id}`}
          className="flex h-full min-w-0 flex-col text-[color:var(--foreground)]"
        >
          <div className="relative aspect-square overflow-hidden bg-[color:var(--muted)]">
            <Image
              src={worker.profile_photo}
              alt={worker.full_name}
              fill
              className="object-cover"
              sizes={compact ? "(max-width: 640px) 50vw, 180px" : "(max-width: 768px) 50vw, 33vw"}
            />
            <Badge
              variant={verificationVariant(worker.verification_status)}
              className="absolute left-1.5 top-1.5 gap-1 normal-case"
            >
              <CheckCircle2 className="h-3 w-3" />
              {verificationLabel(worker.verification_status)}
            </Badge>
          </div>

          <div className={cn("min-w-0 flex-1", compact ? "space-y-1.5 p-2" : "space-y-3 p-3")}>
            <div className="min-w-0">
              <p
                className={cn(
                  "truncate font-extrabold leading-tight",
                  compact ? "text-sm" : "text-base",
                )}
              >
                {worker.full_name}
              </p>
              <p className="mt-0.5 truncate text-[11px] font-bold text-[color:var(--primary)]">
                {roleLabel(worker.primary_role)}
              </p>
            </div>

            <div className="grid min-w-0 gap-1 text-[11px] font-medium text-[color:var(--muted-foreground)]">
              <span className="flex min-w-0 items-center gap-1.5">
                <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                <span className="truncate">
                  {formatExperienceMonths(workerExperienceMonths(worker))}
                </span>
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                <span className="truncate">{worker.location}</span>
              </span>
            </div>

            <div className="flex min-w-0 flex-wrap gap-1.5">
              <span
                className={cn(
                  "inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                  availabilityClass(worker.availability_status),
                )}
              >
                <span className="truncate">
                  {availabilityLabel(worker.availability_status)}
                </span>
              </span>
              {!compact && worker.skills.slice(0, 2).map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex max-w-full items-center rounded-full bg-[color:var(--muted)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--muted-foreground)]"
                >
                  <span className="truncate">{skill.name}</span>
                </span>
              ))}
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
}
