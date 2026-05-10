import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Worker } from "@/lib/types";
import {
  workerContactPhone,
  workerWhatsappHref,
} from "@/lib/booking-workflow";
import { cn } from "@/lib/utils";

export function HireContactCard({ worker }: { worker: Worker }) {
  return (
    <Card>
      <CardContent className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 p-3">
        <div className="relative h-16 w-16 overflow-hidden rounded-md bg-[color:var(--muted)]">
          <Image
            src={worker.profile_photo}
            alt={worker.full_name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[color:var(--foreground)]">
              {worker.full_name}
            </p>
            <p className="truncate text-xs font-bold text-[color:var(--muted-foreground)]">
              {worker.primary_role} / {worker.location}
            </p>
          </div>

          <div className="grid gap-1.5 text-xs font-bold text-[color:var(--foreground)]">
            <span className="flex min-w-0 items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <span className="truncate">{workerContactPhone(worker)}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <span className="truncate">{worker.whatsapp_number}</span>
            </span>
          </div>

          <Link
            href={workerWhatsappHref(worker)}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-full")}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
