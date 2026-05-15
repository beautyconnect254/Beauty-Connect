import { SiteShell } from "@/components/layout/site-shell";

interface PageLoadingSkeletonProps {
  eyebrow: string;
  title: string;
  rows?: number;
}

export function PageLoadingSkeleton({
  eyebrow,
  title,
  rows = 4,
}: PageLoadingSkeletonProps) {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl space-y-4 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="space-y-2">
          <p className="text-[11px] font-bold uppercase text-[color:var(--muted-foreground)]">
            {eyebrow}
          </p>
          <h1 className="max-w-3xl text-2xl font-extrabold leading-tight text-[color:var(--foreground)] sm:text-3xl">
            {title}
          </h1>
          <div className="h-4 w-full max-w-xl animate-pulse rounded-md bg-[color:var(--muted)]" />
        </section>

        <div className="grid gap-2.5 lg:grid-cols-2">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              className="rounded-lg border border-[color:var(--border)] bg-white p-3"
              key={index}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="h-4 w-36 animate-pulse rounded-md bg-[color:var(--muted)]" />
                  <div className="h-3 w-48 animate-pulse rounded-md bg-[color:var(--muted)]" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded-full bg-[color:var(--muted)]" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="h-8 animate-pulse rounded-md bg-[color:var(--muted)]" />
                <div className="h-8 animate-pulse rounded-md bg-[color:var(--muted)]" />
                <div className="h-8 animate-pulse rounded-md bg-[color:var(--muted)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
