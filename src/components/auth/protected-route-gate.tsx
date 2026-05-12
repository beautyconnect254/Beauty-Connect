"use client";

import { useEffect, useRef } from "react";
import { LockKeyhole } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProtectedRouteGateProps {
  description: string;
  href: string;
  title: string;
}

export function ProtectedRouteGate({
  description,
  href,
  title,
}: ProtectedRouteGateProps) {
  const promptedRef = useRef(false);
  const { loading, requireAuth, user } = useAuth();

  useEffect(() => {
    if (loading || user || promptedRef.current) {
      return;
    }

    promptedRef.current = true;
    requireAuth({
      intent: {
        type: "navigate",
        href,
        title,
        description,
      },
    });
  }, [description, href, loading, requireAuth, title, user]);

  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white">
            <LockKeyhole className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[color:var(--foreground)]">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-5 text-[color:var(--muted-foreground)]">
              {description}
            </p>
          </div>
        </div>
        <Button
          onClick={() =>
            requireAuth({
              intent: {
                type: "navigate",
                href,
                title,
                description,
              },
            })
          }
        >
          Login / Sign Up
        </Button>
      </CardContent>
    </Card>
  );
}
