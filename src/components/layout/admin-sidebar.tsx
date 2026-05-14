"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarCheck2,
  Clock3,
  Gauge,
  LayoutDashboard,
  ListPlus,
  LogOut,
  Scissors,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Users,
} from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Core",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Access",
    items: [{ href: "/admin/admins", label: "Admins", icon: ShieldCheck }],
  },
  {
    label: "Settings",
    items: [{ href: "/admin/capacity", label: "Worker Capacity", icon: Gauge }],
  },
  {
    label: "Workers",
    items: [
      { href: "/admin/workers/list", label: "List Worker", icon: ListPlus },
      { href: "/admin/workers/active", label: "Active Workers", icon: Users },
    ],
  },
  {
    label: "Specialties",
    items: [{ href: "/admin/specialties", label: "Specialties", icon: Scissors }],
  },
  {
    label: "Bookings",
    items: [
      { href: "/admin/bookings/pending", label: "Pending", icon: Clock3 },
      { href: "/admin/bookings/confirmed", label: "Confirmed", icon: CalendarCheck2 },
      { href: "/admin/bookings/paid", label: "Paid", icon: BriefcaseBusiness },
    ],
  },
  {
    label: "Promotion",
    items: [
      { href: "/admin/featured-workers", label: "Featured Workers", icon: Sparkles },
    ],
  },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/admin");
    router.refresh();
  }

  return (
    <aside className="h-fit rounded-lg border border-[color:var(--border)] bg-white p-3 shadow-sm lg:sticky lg:top-4">
      <div className="mb-3 flex items-center gap-3 border-b border-[color:var(--border)] pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[color:var(--foreground)] text-white">
          <UserRoundCheck className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-[color:var(--foreground)]">
            Beauty Connect
          </p>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">
            Staffing ops
          </p>
        </div>
      </div>

      <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {navGroups.map((group) => (
          <div key={group.label} className="min-w-0">
            <p className="mb-1 px-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
              {group.label}
            </p>
            <div className="grid gap-1">
              {group.items.map((item) => {
                const active =
                  item.href === "/admin/dashboard"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex min-w-0 items-center gap-2 rounded-md px-2.5 py-2 text-xs font-extrabold transition",
                      active
                        ? "bg-[color:var(--foreground)] text-white"
                        : "text-[color:var(--foreground)] hover:bg-[color:var(--muted)]",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <button
        className="mt-3 flex w-full min-w-0 items-center gap-2 rounded-md border border-[color:var(--border)] px-2.5 py-2 text-xs font-extrabold text-[color:var(--foreground)] transition hover:bg-[color:var(--muted)]"
        onClick={handleSignOut}
        type="button"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span className="truncate">Sign Out</span>
      </button>
    </aside>
  );
}
