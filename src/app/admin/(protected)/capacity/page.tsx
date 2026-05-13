import { AdminWorkerCapacityClient } from "@/components/admin/admin-worker-capacity-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getWorkerCapacitySettingsAsync,
  getWorkersAsync,
} from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminWorkerCapacityPage() {
  const [settings, workers] = await Promise.all([
    getWorkerCapacitySettingsAsync(),
    getWorkersAsync(),
  ]);

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Capacity rules"
        title="Worker Capacity"
        description="Control how many active bookings a worker can hold while keeping manual staffing flexible."
      />
      <AdminWorkerCapacityClient initialSettings={settings} workers={workers} />
    </div>
  );
}
