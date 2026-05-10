import { Card, CardContent } from "@/components/ui/card";
import type { DashboardMetric } from "@/lib/types";

interface DashboardMetricCardProps {
  metric: DashboardMetric;
}

export function DashboardMetricCard({ metric }: DashboardMetricCardProps) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
          {metric.label}
        </p>
        <p className="text-3xl font-extrabold text-[color:var(--foreground)]">
          {metric.value}
        </p>
        <p className="text-xs leading-5 text-[color:var(--muted-foreground)]">
          {metric.detail}
        </p>
      </CardContent>
    </Card>
  );
}
