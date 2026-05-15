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
  const { openAuthModal, user } = useAuth();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    if (user) {
      return;
    }

    const intent: AuthIntent = {
      type: "navigate",
      href,
      title: intentTitle,
      description: intentDescription,
    };

    event.preventDefault();
    openAuthModal(intent);
  }

  return (
    <Link className={className} href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}
