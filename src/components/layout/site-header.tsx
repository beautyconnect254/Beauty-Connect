"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scissors } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/bookings", label: "Bookings" },
  { href: "/hires", label: "Hires" },
  { href: "/workers", label: "Workers" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white">
            <Scissors className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold leading-tight text-[color:var(--foreground)]">
              Beauty Connect
            </p>
            <p className="truncate text-[10px] font-bold uppercase text-[color:var(--muted-foreground)]">
              Salon Staffing Solutions
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--muted)] p-1 md:flex">
          {navigation.map((item) => {
            const active =
              item.href === "/"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-bold transition",
                  active
                    ? "bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white"
                    : "text-[color:var(--muted-foreground)] hover:bg-white hover:text-[color:var(--foreground)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/team-builder"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "hidden sm:inline-flex",
          )}
        >
          Build Team
        </Link>
      </div>
    </header>
  );
}
