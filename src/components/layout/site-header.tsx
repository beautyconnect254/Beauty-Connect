"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/workers", label: "Workers" },
  { href: "/team-builder", label: "Team Builder" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-[color:var(--background)]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl leading-none text-[color:var(--foreground)]">
              Beauty Connect
            </p>
            <p className="text-xs uppercase tracking-[0.26em] text-[color:var(--muted-foreground)]">
              Curated beauty teams
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/70 px-2 py-2 lg:flex">
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
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                    : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--secondary)] hover:text-[color:var(--foreground)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/team-builder"
            className={buttonVariants({ variant: "default", size: "default" })}
          >
            Build a Team
          </Link>
        </div>

        <button
          aria-label="Toggle navigation"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/80 text-[color:var(--foreground)] lg:hidden"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/60 bg-[color:var(--background)]/95 lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
              {navigation.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm font-medium transition",
                      active
                        ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                        : "bg-white/70 text-[color:var(--foreground)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
