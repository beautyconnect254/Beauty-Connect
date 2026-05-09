"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/workers", label: "Workers", icon: Users },
  { href: "/admin/team-requests", label: "Team Requests", icon: ClipboardList },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col gap-5 rounded-[32px] border border-white/70 bg-white/75 p-5 shadow-[0_24px_60px_-32px_rgba(54,33,18,0.28)] backdrop-blur-xl">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--muted-foreground)]">
          Admin console
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-3xl text-[color:var(--foreground)]">
          Beauty Connect
        </h2>
        <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
          Review talent, shape teams, and keep verification quality high.
        </p>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col">
        {adminLinks.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-fit items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                  : "bg-[color:var(--secondary)] text-[color:var(--foreground)] hover:bg-[#eadfcb]",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-[24px] bg-[color:var(--secondary)] p-4">
        <p className="text-sm font-semibold text-[color:var(--foreground)]">
          Today&apos;s focus
        </p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
          Keep verification SLAs tight and send lean shortlists for team requests
          with urgent start dates.
        </p>
      </div>
    </aside>
  );
}
