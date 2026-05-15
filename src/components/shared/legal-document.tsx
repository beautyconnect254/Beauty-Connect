import { Mail } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LegalSection {
  title: string;
  body?: string[];
  bullets?: string[];
}

interface LegalDocumentProps {
  lastUpdated: string;
  sections: LegalSection[];
}

export function LegalDocument({ lastUpdated, sections }: LegalDocumentProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
      <aside className="rounded-lg border border-[color:var(--border)] bg-white p-4 lg:sticky lg:top-24">
        <p className="text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
          Last updated
        </p>
        <p className="mt-1 text-sm font-extrabold text-[color:var(--foreground)]">
          {lastUpdated}
        </p>
        <nav className="mt-4 space-y-2 text-sm font-semibold">
          {sections.map((section) => (
            <a
              className="block rounded-md px-2 py-1.5 text-[color:var(--muted-foreground)] transition hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
              href={`#${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              key={section.title}
            >
              {section.title.replace(/^\d+\.\s*/, "")}
            </a>
          ))}
        </nav>
      </aside>

      <article className="space-y-3">
        {sections.map((section) => (
          <section
            className="rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm sm:p-5"
            id={section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
            key={section.title}
          >
            <h2 className="text-lg font-extrabold text-[color:var(--foreground)]">
              {section.title}
            </h2>
            {section.body?.map((paragraph) => (
              <p
                className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]"
                key={paragraph}
              >
                {paragraph}
              </p>
            ))}
            {section.bullets ? (
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                {section.bullets.map((item) => (
                  <li className="flex gap-2" key={item}>
                    <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[color:var(--accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <section className="flex flex-col gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--secondary)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[color:var(--secondary-foreground)]">
              Need help with this policy?
            </h2>
            <p className="mt-1 text-sm font-semibold text-emerald-900/75">
              Contact Beauty Connect support for privacy, refund, or booking questions.
            </p>
          </div>
          <a
            className={cn(buttonVariants({ variant: "outline" }), "bg-white")}
            href="mailto:beautyconnect254@gmail.com"
          >
            <Mail className="h-4 w-4" />
            Email support
          </a>
        </section>
      </article>
    </div>
  );
}
