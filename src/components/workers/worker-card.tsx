"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, BriefcaseBusiness, MapPin, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { Worker } from "@/lib/types";
import {
  availabilityLabel,
  cn,
  formatCurrency,
  verificationLabel,
} from "@/lib/utils";

interface WorkerCardProps {
  worker: Worker;
  compact?: boolean;
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

function availabilityVariant(status: Worker["availability_status"]) {
  switch (status) {
    case "available":
      return "verified";
    case "reserved":
      return "pending";
    case "hired":
    case "unavailable":
      return "critical";
    default:
      return "outline";
  }
}

export function WorkerCard({ worker, compact = false }: WorkerCardProps) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.22 }}>
      <Card className="h-full overflow-hidden">
        <div className="relative aspect-[4/4.4] overflow-hidden">
          <Image
            src={worker.profile_photo}
            alt={worker.full_name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-4">
            <Badge variant={verificationVariant(worker.verification_status)}>
              {verificationLabel(worker.verification_status)}
            </Badge>
            <Badge variant={availabilityVariant(worker.availability_status)}>
              {availabilityLabel(worker.availability_status)}
            </Badge>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-[family-name:var(--font-display)] text-3xl leading-none text-[color:var(--foreground)]">
                  {worker.full_name}
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                  {worker.primary_role}
                </p>
              </div>
              {worker.featured ? (
                <div className="rounded-full bg-[color:var(--secondary)] p-2 text-[color:var(--primary)]">
                  <Sparkles className="h-4 w-4" />
                </div>
              ) : null}
            </div>

            <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
              {worker.headline}
            </p>
          </div>

          <div className="grid gap-3 text-sm text-[color:var(--muted-foreground)] sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[color:var(--primary)]" />
              <span>{worker.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4 text-[color:var(--primary)]" />
              <span>{worker.years_of_experience} years</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {worker.skills.slice(0, compact ? 2 : 3).map((skill) => (
              <Badge key={skill.id} variant="outline" className="normal-case tracking-normal">
                {skill.name}
              </Badge>
            ))}
          </div>

          {!compact ? (
            <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
              {worker.bio}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                Expected monthly
              </p>
              <p className="text-lg font-semibold text-[color:var(--foreground)]">
                {formatCurrency(worker.salary_expectation)}
              </p>
            </div>

            <Link
              href={`/workers/${worker.id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-2",
              )}
            >
              View profile
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
