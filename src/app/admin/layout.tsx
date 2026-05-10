import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[1500px] px-3 py-4 sm:px-4 lg:px-5">
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <AdminSidebar />
        <main className="min-w-0 space-y-4">{children}</main>
      </div>
    </div>
  );
}
