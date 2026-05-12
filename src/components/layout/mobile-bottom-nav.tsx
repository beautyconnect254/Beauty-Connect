"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Home, UserCheck } from "lucide-react";

import { ProtectedLink } from "@/components/auth/protected-link";
import { cn } from "@/lib/utils";

const mobileNavigation = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/hires", label: "Hires", icon: UserCheck },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--border)] bg-white/96 px-3 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1.5 shadow-[0_-8px_24px_-20px_rgba(15,23,42,0.7)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
          const protectedItem = item.href === "/bookings" || item.href === "/hires";
          const className = cn(
            "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 text-[11px] font-extrabold transition",
            active
              ? "bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white"
              : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]",
          );
          const content = (
            <>
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </>
          );

          return protectedItem ? (
            <ProtectedLink
              className={className}
              href={item.href}
              intentTitle={`Sign in to view ${item.label.toLowerCase()}`}
              key={item.href}
            >
              {content}
            </ProtectedLink>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
