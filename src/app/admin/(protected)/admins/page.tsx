import { AdminWhitelistClient } from "@/components/admin/admin-whitelist-client";
import { PageIntro } from "@/components/shared/page-intro";
import { getAdminSession } from "@/lib/admin-auth";
import type { AdminWhitelistRecord } from "@/lib/admin-auth-shared";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const adminColumns = "email, active, added_by, created_at, updated_at";

export default async function AdminsPage() {
  const adminSession = await getAdminSession();
  const supabase = createSupabaseServiceClient() ?? createSupabaseServerClient();
  let admins: AdminWhitelistRecord[] = [];

  if (adminSession && supabase) {
    const { data } = await supabase
      .from("admin_email_whitelist")
      .select(adminColumns)
      .order("created_at", { ascending: false });

    admins = (data ?? []) as AdminWhitelistRecord[];
  }

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Access"
        title="Admins"
        description="Assign magic-link access for Beauty Connect admin operations."
      />
      <AdminWhitelistClient
        currentAdminEmail={adminSession?.email ?? ""}
        initialAdmins={admins}
      />
    </div>
  );
}
