import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { WorkerCard } from "@/components/workers/worker-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Worker, WorkerCategory, WorkerRole } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HomePageProps {
  featuredWorkers: Worker[];
  categories: WorkerCategory[];
}

const heroImage =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1800&q=80";

const preferredRoles: WorkerRole[] = [
  "Hair Stylist",
  "Barber",
  "Nail Technician",
  "Makeup Artist",
  "Spa Therapist",
  "Braider",
  "Wig Specialist",
];

const process = [
  {
    step: "1",
    title: "We Verify Workers",
    description: "Every worker is checked before being listed.",
  },
  {
    step: "2",
    title: "Build Your Team",
    description: "Choose the workers and experience level you need.",
  },
  {
    step: "3",
    title: "Hire & Get Started",
    description: "Confirm your booking and start building your salon team.",
  },
];

function roleLabel(role: WorkerRole) {
  return role === "Hair Stylist" ? "Hairstylist" : role;
}

function shortDate(date: string | null) {
  if (!date) {
    return "No expiry";
  }

  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function HomePage({ featuredWorkers, categories }: HomePageProps) {
  const categoryRoles = preferredRoles.filter((role) =>
    categories.some((category) => category.role === role),
  );

  return (
    <div className="overflow-x-hidden">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image
          src={heroImage}
          alt="Salon workers preparing a beauty station"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.44]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(45,17,92,0.95),rgba(5,120,87,0.8))]" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-7 sm:px-6 sm:py-9 lg:px-8">
          <Reveal className="max-w-3xl space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-md border border-white/20 bg-white/12 px-3 py-1.5 text-[11px] font-bold uppercase text-white/85">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
              Verified salon workers
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
                Build Your Salon Team With Verified Workers
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/86 sm:text-base">
                Find experienced hairstylists, barbers, nail technicians, makeup artists,
                spa workers, and more.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/team-builder"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "bg-emerald-400 text-emerald-950 hover:bg-emerald-300",
                )}
              >
                Build Team
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/workers"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-white/30 bg-white/12 text-white hover:bg-white/20",
                )}
              >
                Single Booking
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 lg:px-8">
        <Reveal className="space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase text-[color:var(--muted-foreground)]">
              Worker categories
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-[color:var(--foreground)] sm:text-2xl">
              Start with a role
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {categoryRoles.map((role) => (
              <Link
                className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1.5 text-xs font-bold text-[color:var(--foreground)] transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-900"
                href={`/workers?role=${encodeURIComponent(role)}`}
                key={role}
              >
                {roleLabel(role)}
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 lg:px-8">
        <Reveal className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase text-[color:var(--muted-foreground)]">
              Paid visibility
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-[color:var(--foreground)] sm:text-2xl">
              Featured Workers
            </h2>
          </div>
          <Link
            href="/workers"
            className="text-xs font-bold text-[color:var(--primary)] hover:text-emerald-700"
          >
            Browse all
          </Link>
        </Reveal>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {featuredWorkers.map((worker, index) => (
            <Reveal key={worker.id} delay={index * 0.025}>
              <div className="space-y-1.5">
                <WorkerCard worker={worker} compact />
                <div className="rounded-md border border-[color:var(--border)] bg-white px-2 py-1.5 text-[10px] font-bold text-[color:var(--muted-foreground)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-emerald-700">
                      {worker.featured_status}
                    </span>
                    <span className="truncate">Priority {worker.featured_priority_score}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span>Freq {worker.featured_frequency}</span>
                    <span>Until {shortDate(worker.featured_expires_at)}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 lg:px-8">
        <Reveal className="mb-3">
          <h2 className="text-xl font-extrabold text-[color:var(--foreground)] sm:text-2xl">
            How Hiring Works
          </h2>
        </Reveal>

        <div className="grid gap-2.5 md:grid-cols-3">
          {process.map((item, index) => (
            <Reveal key={item.step} delay={index * 0.035}>
              <Card className="h-full">
                <CardContent className="flex gap-3 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-sm font-extrabold text-white">
                    {item.step}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-[color:var(--foreground)]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[color:var(--muted-foreground)]">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
