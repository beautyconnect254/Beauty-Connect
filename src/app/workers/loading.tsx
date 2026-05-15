import { PageLoadingSkeleton } from "@/components/layout/page-loading-skeleton";

export default function Loading() {
  return (
    <PageLoadingSkeleton
      eyebrow="Workers"
      title="Browse Verified Workers"
      rows={6}
    />
  );
}
