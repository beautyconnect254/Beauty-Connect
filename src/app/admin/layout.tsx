import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <AdminSidebar />
        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
