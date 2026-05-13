import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, CalendarCheck, CreditCard, Users } from "lucide-react";

import { ProtectedRouteGate } from "@/components/auth/protected-route-gate";
import { HireContactCard } from "@/components/hires/hire-contact-card";
import { SiteShell } from "@/components/layout/site-shell";
import { TrackingLinkCard } from "@/components/shared/tracking-link-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUserHireById } from "@/lib/data-access";
import { getCurrentUser } from "@/lib/user-auth";
import { cn, formatCurrency } from "@/lib/utils";

interface HireDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function HireDetailPage({ params }: HireDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-5xl space-y-4 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
          <ProtectedRouteGate
            href={`/hires/${id}`}
            title="Sign in to view this hire"
            description="Hire details and contact access are private to the account that owns the booking."
          />
        </div>
      </SiteShell>
    );
  }

  const hire = await getUserHireById(id, user.id);

  if (!hire) {
    notFound();
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl space-y-4 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
        <Link
          href="/hires"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-0")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to hires
        </Link>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-[color:var(--muted-foreground)]">
                  Paid hire
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-[color:var(--foreground)]">
                  {hire.title}
                </h1>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 normal-case">
                Contacts unlocked
              </Badge>
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded-md bg-[color:var(--muted)] p-3">
                <Users className="h-4 w-4 text-emerald-700" />
                <p className="mt-2 text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
                  Workers
                </p>
                <p className="text-lg font-extrabold">{hire.worker_count}</p>
              </div>
              <div className="rounded-md bg-[color:var(--muted)] p-3">
                <CalendarCheck className="h-4 w-4 text-emerald-700" />
                <p className="mt-2 text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
                  Hire date
                </p>
                <p className="text-lg font-extrabold">
                  {format(parseISO(hire.hire_date), "MMM d, yyyy")}
                </p>
              </div>
              <div className="rounded-md bg-[color:var(--muted)] p-3">
                <CreditCard className="h-4 w-4 text-emerald-700" />
                <p className="mt-2 text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
                  Payment ref
                </p>
                <p className="text-lg font-extrabold">{hire.payment_reference}</p>
              </div>
              {hire.booking?.payment_instructions ? (
                <div className="rounded-md bg-[color:var(--muted)] p-3">
                  <CreditCard className="h-4 w-4 text-emerald-700" />
                  <p className="mt-2 text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
                    Platform fee
                  </p>
                  <p className="text-lg font-extrabold">
                    {formatCurrency(hire.booking.payment_instructions.deposit_amount)}
                  </p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <TrackingLinkCard trackingToken={hire.booking?.tracking_token ?? null} />

        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-[color:var(--foreground)]">
            Worker Contacts
          </h2>
          <div className="grid gap-2.5 lg:grid-cols-2">
            {hire.workers.map((worker) => (
              <HireContactCard
                key={worker.id}
                worker={worker}
                assignment={hire.worker_assignments.find(
                  (item) => item.worker_id === worker.id,
                )}
              />
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
