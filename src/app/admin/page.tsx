import type { Metadata } from "next";

import { AdminLoginClient } from "@/components/admin/admin-login-client";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[color:var(--muted)] px-3 py-8">
      <AdminLoginClient />
    </main>
  );
}
