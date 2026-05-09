import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, CheckCircle2, Clock3, MessageCircleMore, Shield } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { WorkerCard } from "@/components/workers/worker-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getPublicWorkerById,
  getPublicWorkers,
  getRelatedWorkers,
} from "@/lib/data-access";
import {
  availabilityLabel,
  cn,
  formatCurrency,
  verificationLabel,
} from "@/lib/utils";

interface WorkerProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return getPublicWorkers().map((worker) => ({ id: worker.id }));
}

export async function generateMetadata({
  params,
}: WorkerProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const worker = getPublicWorkerById(id);

  if (!worker) {
    return { title: "Worker not found" };
  }

  return {
    title: worker.full_name,
    description: worker.headline,
  };
}

export default async function WorkerProfilePage({
  params,
}: WorkerProfilePageProps) {
  const { id } = await params;
  const worker = getPublicWorkerById(id);

  if (!worker) {
    notFound();
  }

  const relatedWorkers = getRelatedWorkers(worker);
  const verifiedDocumentCount = worker.verification_documents.filter(
    (document) => document.status === "verified",
  ).length;
  const latestDocument = worker.verification_documents[0];
  const whatsappLink = `https://wa.me/${worker.whatsapp_number.replace(/\D/g, "")}`;

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Link
          href="/workers"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "inline-flex gap-2 px-0",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to workers
        </Link>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                <div className="relative min-h-[420px] overflow-hidden bg-[color:var(--secondary)]">
                  <Image
                    src={worker.profile_photo}
                    alt={worker.full_name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 360px"
                    priority
                  />
                </div>

                <CardContent className="space-y-6 p-6 lg:p-8">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="verified">{verificationLabel(worker.verification_status)}</Badge>
                    <Badge variant="outline">{availabilityLabel(worker.availability_status)}</Badge>
                    <Badge variant="outline">{worker.work_type}</Badge>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
                      {worker.primary_role}
                    </p>
                    <h1 className="font-[family-name:var(--font-display)] text-5xl leading-none text-[color:var(--foreground)] sm:text-6xl">
                      {worker.full_name}
                    </h1>
                    <p className="text-lg leading-8 text-[color:var(--muted-foreground)]">
                      {worker.bio}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                        Location
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {worker.location}
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                        Experience
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {worker.years_of_experience} years
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                        Expected monthly
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {formatCurrency(worker.salary_expectation)}
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                        WhatsApp
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {worker.whatsapp_number}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(buttonVariants({ variant: "default" }), "gap-2")}
                    >
                      <MessageCircleMore className="h-4 w-4" />
                      Contact on WhatsApp
                    </Link>
                    <Link
                      href="/team-builder"
                      className={buttonVariants({ variant: "outline" })}
                    >
                      Add to a team request
                    </Link>
                  </div>
                </CardContent>
              </div>
            </Card>

            <Card>
              <CardContent className="space-y-6 p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--muted-foreground)]">
                    Specialist skills
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {worker.skills.map((skill) => (
                      <Badge
                        key={skill.id}
                        variant="outline"
                        className="normal-case tracking-normal"
                      >
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--muted-foreground)]">
                    Portfolio highlights
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {worker.portfolio.map((item) => (
                      <div key={item.id} className="overflow-hidden rounded-[26px] border border-white/70 bg-white/60">
                        <div className="relative aspect-[4/4.5]">
                          <Image
                            src={item.image_url}
                            alt={item.caption}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 30vw"
                          />
                        </div>
                        <div className="p-4">
                          <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
                            {item.caption}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[color:var(--secondary)] p-2 text-[color:var(--primary)]">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">
                      Verification snapshot
                    </p>
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                      Admin-reviewed profile quality markers
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                    Verified documents
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
                    {verifiedDocumentCount}
                  </p>
                </div>

                {latestDocument ? (
                  <div className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4">
                    <div className="flex items-center gap-3">
                      <Clock3 className="h-4 w-4 text-[color:var(--primary)]" />
                      <div>
                        <p className="font-medium text-[color:var(--foreground)]">
                          Latest document upload
                        </p>
                        <p className="text-sm text-[color:var(--muted-foreground)]">
                          {latestDocument.document_type} ·{" "}
                          {format(parseISO(latestDocument.uploaded_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <div>
                      <p className="font-medium text-[color:var(--foreground)]">
                        Availability tracking enabled
                      </p>
                      <p className="text-sm text-[color:var(--muted-foreground)]">
                        {availabilityLabel(worker.availability_status)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <section className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted-foreground)]">
              Related talent
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl text-[color:var(--foreground)]">
              Similar workers for team planning
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedWorkers.map((candidate) => (
              <WorkerCard key={candidate.id} worker={candidate} compact />
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
