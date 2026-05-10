import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CalendarCheck, CheckCircle2, MapPin } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicWorkerById, getPublicWorkers } from "@/lib/data-access";
import { availabilityLabel, cn, verificationLabel } from "@/lib/utils";

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
    description: worker.bio,
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

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl space-y-4 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
        <Link
          href="/workers"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-0")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to workers
        </Link>

        <Card className="overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[260px_minmax(0,1fr)]">
            <div className="relative aspect-square bg-[color:var(--muted)] md:aspect-auto md:min-h-[320px]">
              <Image
                src={worker.profile_photo}
                alt={worker.full_name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 260px"
                priority
              />
            </div>

            <CardContent className="space-y-4 p-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="verified" className="gap-1 normal-case">
                  <CheckCircle2 className="h-3 w-3" />
                  {verificationLabel(worker.verification_status)}
                </Badge>
                <Badge variant="outline" className="normal-case">
                  {availabilityLabel(worker.availability_status)}
                </Badge>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-[color:var(--primary)]">
                  {worker.primary_role}
                </p>
                <h1 className="mt-1 text-2xl font-extrabold leading-tight text-[color:var(--foreground)] sm:text-3xl">
                  {worker.full_name}
                </h1>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                  {worker.bio}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-md bg-[color:var(--muted)] p-3">
                  <BriefcaseBusiness className="h-4 w-4 text-emerald-700" />
                  <p className="mt-2 text-[11px] font-bold uppercase text-[color:var(--muted-foreground)]">
                    Experience
                  </p>
                  <p className="text-sm font-extrabold">
                    {worker.years_of_experience} years
                  </p>
                </div>
                <div className="rounded-md bg-[color:var(--muted)] p-3">
                  <MapPin className="h-4 w-4 text-emerald-700" />
                  <p className="mt-2 text-[11px] font-bold uppercase text-[color:var(--muted-foreground)]">
                    Location
                  </p>
                  <p className="text-sm font-extrabold">{worker.location}</p>
                </div>
                <div className="rounded-md bg-[color:var(--muted)] p-3">
                  <CalendarCheck className="h-4 w-4 text-emerald-700" />
                  <p className="mt-2 text-[11px] font-bold uppercase text-[color:var(--muted-foreground)]">
                    Availability
                  </p>
                  <p className="text-sm font-extrabold">
                    {availabilityLabel(worker.availability_status)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {worker.skills.map((skill) => (
                  <Badge key={skill.id} variant="outline" className="normal-case">
                    {skill.name}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/bookings?worker=${worker.id}`}
                  className={buttonVariants({ variant: "default", size: "sm" })}
                >
                  Book Worker
                </Link>
                <Link
                  href={`/team-builder?worker=${worker.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Add To Team
                </Link>
              </div>
            </CardContent>
          </div>
        </Card>

        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-[color:var(--foreground)]">
            Portfolio
          </h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {worker.portfolio.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-lg border border-[color:var(--border)] bg-white"
              >
                <div className="relative aspect-square">
                  <Image
                    src={item.image_url}
                    alt={item.caption}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 220px"
                  />
                </div>
                <p className="truncate px-2 py-1.5 text-xs font-semibold text-[color:var(--muted-foreground)]">
                  {item.caption}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
