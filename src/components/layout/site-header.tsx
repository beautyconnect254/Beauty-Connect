"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleHelp,
  FileText,
  LogOut,
  MoreVertical,
  ReceiptText,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ProtectedLink } from "@/components/auth/protected-link";
import { useAuth } from "@/components/auth/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/bookings", label: "Bookings" },
  { href: "/hires", label: "Hires" },
  { href: "/workers", label: "Workers" },
];

const utilityLinks = [
  { href: "/help", label: "Help & FAQs", icon: CircleHelp },
  { href: "/terms", label: "T&C", icon: FileText },
  { href: "/privacy", label: "Privacy policy", icon: ShieldCheck },
  { href: "/refund-policy", label: "Refund Policy", icon: ReceiptText },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { loading, openAuthModal, signOut, user } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [utilityOpen, setUtilityOpen] = useState(false);
  const anyMenuOpen = profileOpen || utilityOpen;

  useEffect(() => {
    if (!anyMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setProfileOpen(false);
        setUtilityOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [anyMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-white">
            <Image
              src="/brand/logo.png"
              alt="Beauty Connect logo"
              fill
              priority
              sizes="36px"
              className="object-contain"
            />
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
            const protectedItem =
              item.href === "/bookings" || item.href === "/hires";
            const className = cn(
              "rounded-md px-3 py-1.5 text-xs font-bold transition",
              active
                ? "bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white"
                : "text-[color:var(--muted-foreground)] hover:bg-white hover:text-[color:var(--foreground)]",
            );

            return protectedItem ? (
              <ProtectedLink
                className={className}
                href={item.href}
                intentTitle={`Sign in to view ${item.label.toLowerCase()}`}
                key={item.href}
              >
                {item.label}
              </ProtectedLink>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={className}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="relative flex shrink-0 items-center gap-2"
          ref={menuRef}
        >
          <ProtectedLink
            href="/team-builder"
            intentTitle="Sign in to build your team"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            Build Team
          </ProtectedLink>

          {user ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setUtilityOpen(false);
                  setProfileOpen((current) => !current);
                }}
              >
                <UserCircle className="h-4 w-4" />
                Profile
              </Button>
              {profileOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] w-64 rounded-lg border border-[color:var(--border)] bg-white p-3 shadow-xl">
                  <p className="text-[10px] font-extrabold uppercase text-[color:var(--muted-foreground)]">
                    Signed in
                  </p>
                  <p className="mt-1 truncate text-sm font-extrabold text-[color:var(--foreground)]">
                    {user.email ?? "Beauty Connect user"}
                  </p>
                  <Button
                    className="mt-3 w-full"
                    onClick={() => {
                      setProfileOpen(false);
                      void signOut();
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => openAuthModal()}
            >
              Login / Sign Up
            </Button>
          )}

          <Button
            aria-expanded={utilityOpen}
            aria-label="Open more menu"
            size="icon"
            variant="ghost"
            onClick={() => {
              setProfileOpen(false);
              setUtilityOpen((current) => !current);
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>

          {utilityOpen ? (
            <div className="absolute right-0 top-[calc(100%+0.5rem)] w-56 overflow-hidden rounded-lg border border-[color:var(--border)] bg-white p-1.5 shadow-xl">
              {utilityLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-bold text-[color:var(--foreground)] hover:bg-[color:var(--muted)]"
                    href={item.href}
                    key={item.href}
                    onClick={() => setUtilityOpen(false)}
                  >
                    <Icon className="h-4 w-4 text-emerald-700" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
