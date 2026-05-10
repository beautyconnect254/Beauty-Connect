import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--border)] bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="space-y-1">
          <p className="text-lg font-extrabold text-[color:var(--foreground)]">
            Beauty Connect
          </p>
          <p className="max-w-xl text-sm leading-5 text-[color:var(--muted-foreground)]">
            Salon Staffing Solutions for beauty businesses in Kenya.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm font-semibold text-[color:var(--muted-foreground)]">
          <Link href="/bookings" className="hover:text-[color:var(--foreground)]">
            Bookings
          </Link>
          <Link href="/hires" className="hover:text-[color:var(--foreground)]">
            Hires
          </Link>
          <Link href="/workers" className="hover:text-[color:var(--foreground)]">
            Workers
          </Link>
          <Link
            href="/team-builder"
            className="hover:text-[color:var(--foreground)]"
          >
            Build Team
          </Link>
          <Link href="/admin" className="hover:text-[color:var(--foreground)]">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
