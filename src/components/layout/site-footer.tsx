import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/60 bg-white/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="space-y-2">
          <p className="font-[family-name:var(--font-display)] text-2xl text-[color:var(--foreground)]">
            Beauty Connect
          </p>
          <p className="max-w-xl text-sm leading-6 text-[color:var(--muted-foreground)]">
            Curated salon staffing for owners who need trusted beauty talent in
            dependable, role-based teams.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-[color:var(--muted-foreground)]">
          <Link href="/workers" className="hover:text-[color:var(--foreground)]">
            Browse workers
          </Link>
          <Link
            href="/team-builder"
            className="hover:text-[color:var(--foreground)]"
          >
            Build a team
          </Link>
          <Link href="/admin" className="hover:text-[color:var(--foreground)]">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
