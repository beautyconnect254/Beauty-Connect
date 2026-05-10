import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CalendarCheck, CreditCard, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Hire } from "@/lib/types";

interface HireCardProps {
  hire: Hire;
}

export function HireCard({ hire }: HireCardProps) {
  const workerNames = hire.workers.map((worker) => worker.full_name).join(", ");

  return (
    <Link href={`/hires/${hire.id}`} className="block">
      <Card className="transition hover:border-emerald-400 hover:shadow-md">
        <CardContent className="space-y-3 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[color:var(--foreground)]">
                {hire.title}
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-[color:var(--muted-foreground)]">
                {workerNames}
              </p>
            </div>
            <Badge className="shrink-0 bg-emerald-100 text-emerald-800 normal-case">
              {hire.status}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-bold text-[color:var(--muted-foreground)]">
            <span className="flex min-w-0 items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <span className="truncate">{hire.worker_count} workers</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <span className="truncate">{format(parseISO(hire.hire_date), "MMM d")}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <span className="truncate">{hire.payment_reference}</span>
            </span>
          </div>

          <div className="rounded-md bg-emerald-50 px-2 py-1.5 text-[11px] font-bold text-emerald-800">
            Payment confirmed
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
