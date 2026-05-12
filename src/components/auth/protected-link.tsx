"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import type { AuthIntent } from "@/lib/user-auth-shared";

interface ProtectedLinkProps {
  children: ReactNode;
  className?: string;
  href: string;
  intentDescription?: string;
  intentTitle?: string;
}

export function ProtectedLink({
  children,
  className,
  href,
  intentDescription,
  intentTitle,
}: ProtectedLinkProps) {
  const { requireAuth } = useAuth();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const intent: AuthIntent = {
      type: "navigate",
      href,
      title: intentTitle,
      description: intentDescription,
    };
    const allowed = requireAuth({ intent });

    if (!allowed) {
      event.preventDefault();
    }
  }

  return (
    <Link className={className} href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}
