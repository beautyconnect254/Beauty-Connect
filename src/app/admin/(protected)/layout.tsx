import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { getAdminSession } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const adminSession = await getAdminSession();

  if (!adminSession) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1500px] px-3 py-4 sm:px-4 lg:px-5">
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <AdminSidebar />
        <main className="min-w-0 space-y-4">{children}</main>
      </div>
    </div>
  );
}
