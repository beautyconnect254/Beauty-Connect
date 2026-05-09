import { Card, CardContent } from "@/components/ui/card";
import type { DashboardMetric } from "@/lib/types";

interface DashboardMetricCardProps {
  metric: DashboardMetric;
}

export function DashboardMetricCard({ metric }: DashboardMetricCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
          {metric.label}
        </p>
        <p className="font-[family-name:var(--font-display)] text-5xl text-[color:var(--foreground)]">
          {metric.value}
        </p>
        <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
          {metric.detail}
        </p>
      </CardContent>
    </Card>
  );
}
