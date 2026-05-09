import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Users } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { WorkerCard } from "@/components/workers/worker-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Worker, WorkerCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HomePageProps {
  featuredWorkers: Worker[];
  categories: WorkerCategory[];
}

const highlights = [
  {
    title: "Admin-verified talent",
    description:
      "Every public worker profile is reviewed before it appears in the marketplace.",
    icon: ShieldCheck,
  },
  {
    title: "Batch hiring, not one-offs",
    description:
      "Salon owners can request complete staffing pods by role, experience, and availability.",
    icon: Users,
  },
  {
    title: "Fast shortlist delivery",
    description:
      "Structured requests make it easy to recommend workers without endless back-and-forth.",
    icon: CheckCircle2,
  },
];

const process = [
  {
    step: "01",
    title: "Admins recruit and verify",
    description:
      "Workers are vetted manually with portfolio checks, references, and document review before going live.",
  },
  {
    step: "02",
    title: "Owners define the team",
    description:
      "Choose roles, quantity per role, minimum experience, location, and hiring timeline in one clean flow.",
  },
  {
    step: "03",
    title: "Beauty Connect recommends talent",
    description:
      "Request-ready workers are surfaced with verified context, availability visibility, and portfolio proof.",
  },
];

export function HomePage({ featuredWorkers, categories }: HomePageProps) {
  return (
    <div className="pb-20">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(227,195,167,0.46),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.92),transparent_42%)]" />
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-20">
          <Reveal className="relative space-y-8">
            <div className="inline-flex rounded-full border border-white/70 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted-foreground)] shadow-sm">
              Premium beauty staffing
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--foreground)] sm:text-6xl lg:text-7xl">
                Build verified salon teams with elegance and speed.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[color:var(--muted-foreground)] sm:text-lg">
                Beauty Connect helps salon owners recruit curated beauty workers in
                batches, not just individual hires, so launch plans and staffing
                gaps are easier to solve with confidence.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/team-builder"
                className={cn(buttonVariants({ variant: "default", size: "lg" }), "gap-2")}
              >
                Start team builder
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/workers"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Browse verified workers
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Verified talent", value: "12" },
                { label: "Active cities", value: "5" },
                { label: "Open team requests", value: "4" },
              ].map((item) => (
                <Card key={item.label}>
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                      {item.label}
                    </p>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[color:var(--foreground)]">
                      {item.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.08} className="relative">
            <Card className="overflow-hidden rounded-[36px] p-6">
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {highlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[26px] bg-[color:var(--secondary)] p-5"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[color:var(--primary)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-4 font-semibold text-[color:var(--foreground)]">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted-foreground)]">
            Worker categories
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl text-[color:var(--foreground)] sm:text-5xl">
            Curated talent across high-demand beauty roles
          </h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category, index) => (
            <Reveal key={category.role} delay={index * 0.04}>
              <Card className="h-full">
                <CardContent className="space-y-4 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">
                    {category.role}
                  </p>
                  <p className="text-sm leading-6 text-[color:var(--foreground)]">
                    {category.description}
                  </p>
                  <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
                    {category.typical_team_use}
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted-foreground)]">
            Featured talent
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl text-[color:var(--foreground)] sm:text-5xl">
            Workers already prepared for shortlist conversations
          </h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featuredWorkers.map((worker, index) => (
            <Reveal key={worker.id} delay={index * 0.05}>
              <WorkerCard worker={worker} compact />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {process.map((item, index) => (
            <Reveal key={item.step} delay={index * 0.05}>
              <Card className="h-full">
                <CardContent className="space-y-4 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted-foreground)]">
                    {item.step}
                  </p>
                  <h3 className="font-[family-name:var(--font-display)] text-3xl text-[color:var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <Card className="overflow-hidden bg-[linear-gradient(135deg,#4d3323_0%,#7d5a3c_45%,#d8c1a8_100%)] text-white">
            <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
              <div className="space-y-5">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">
                  Team builder
                </p>
                <h2 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl">
                  Request full beauty teams with role-by-role clarity.
                </h2>
                <p className="max-w-2xl text-base leading-8 text-white/80">
                  Owners can define exact headcount needs, minimum experience, work
                  type, and location, then submit a clean request that’s ready for
                  admin matching and shortlist delivery.
                </p>
                <Link
                  href="/team-builder"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "lg" }),
                    "bg-white text-[#5c412e] hover:bg-[#f4eadf]",
                  )}
                >
                  Open team builder
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  "Choose quantity per role",
                  "Set experience minimums",
                  "Submit for curated recommendations",
                ].map((item) => (
                  <div key={item} className="rounded-[26px] border border-white/20 bg-white/10 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                      Workflow
                    </p>
                    <p className="mt-3 text-lg leading-7 text-white">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
