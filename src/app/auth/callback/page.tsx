import { Suspense } from "react";

import { AuthCallbackClient } from "@/components/auth/auth-callback-client";
import { SiteShell } from "@/components/layout/site-shell";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <SiteShell>
      <Suspense fallback={null}>
        <AuthCallbackClient />
      </Suspense>
    </SiteShell>
  );
}
