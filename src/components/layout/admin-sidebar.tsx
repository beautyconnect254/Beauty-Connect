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
    <aside className="flex flex-col gap-4 rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--muted-foreground)]">
          Admin console
        </p>
        <h2 className="text-xl font-extrabold text-[color:var(--foreground)]">
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
                "flex min-w-fit items-center gap-3 rounded-md px-3 py-2 text-sm font-bold transition",
                active
                  ? "bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white"
                  : "bg-[color:var(--muted)] text-[color:var(--foreground)] hover:bg-emerald-50",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-md bg-emerald-50 p-3">
        <p className="text-sm font-semibold text-[color:var(--foreground)]">
          Today&apos;s focus
        </p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
          Check worker documents and reply to urgent team requests first.
        </p>
      </div>
    </aside>
  );
}
