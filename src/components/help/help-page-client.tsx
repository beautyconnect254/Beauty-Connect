"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Banknote,
  CalendarCheck,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const supportEmail = "beautyconnect254@gmail.com";
const supportPhone = "0721140200";
const whatsappHref =
  "https://wa.me/254721140200?text=Hi%20Beauty%20Connect%2C%20I%20need%20help%20with%20a%20booking.";

const categories = [
  "All",
  "Bookings",
  "Payments",
  "Workers",
  "Accounts",
  "Policies",
] as const;

const faqs = [
  {
    category: "Bookings",
    question: "How does Beauty Connect confirm a booking?",
    answer:
      "Submit a single-worker or team request with your salon details, date, location, and required skills. The admin team checks availability, confirms the booking, then payment unlocks final assignment and contact access.",
  },
  {
    category: "Bookings",
    question: "Can I book a full team for a salon opening or event?",
    answer:
      "Yes. Use Build Team to request multiple roles such as barbers, hair stylists, nail technicians, lash artists, or makeup artists. Add the start date, location, and any shift notes so the admin team can match the right workers.",
  },
  {
    category: "Payments",
    question: "Why do I need to pay a deposit?",
    answer:
      "The deposit secures the booking, reserves available workers, and allows Beauty Connect to finalize allocation. Payment is processed by third-party payment providers, and Beauty Connect does not store full card details.",
  },
  {
    category: "Payments",
    question: "What happens after payment is confirmed?",
    answer:
      "Your booking is marked paid, worker contacts are unlocked in Hires, and you can coordinate reporting time, service scope, and day-of logistics directly with the assigned worker or team.",
  },
  {
    category: "Workers",
    question: "Are workers employed by Beauty Connect?",
    answer:
      "Workers are independent service providers unless explicitly stated otherwise. Beauty Connect helps with discovery, booking review, confirmation, and contact release after the booking flow is complete.",
  },
  {
    category: "Workers",
    question: "Can I replace a worker if availability changes?",
    answer:
      "If a confirmed provider becomes unavailable before assignment, the admin team can review replacement options. Share the booking reference and required role when contacting support.",
  },
  {
    category: "Accounts",
    question: "What information is collected when I sign in with Google?",
    answer:
      "Beauty Connect only uses basic Google profile information such as name, email, and profile picture for authentication and account identification. It does not access Gmail content or sensitive Google data.",
  },
  {
    category: "Policies",
    question: "When can a refund be approved?",
    answer:
      "Refunds may be approved when a booking was not confirmed by admin, a service provider was unavailable with no replacement provided, or a duplicate or erroneous payment occurred.",
  },
  {
    category: "Policies",
    question: "When is a payment non-refundable?",
    answer:
      "Payments are not refundable after a booking has been confirmed and workers assigned, after the service has started or been completed, or when cancellation happens after payment confirmation.",
  },
  {
    category: "Payments",
    question: "How long do approved refunds take?",
    answer:
      "Approved refunds may take 3-7 business days depending on the payment provider. Report payment issues promptly so the admin team can investigate with the correct reference.",
  },
  {
    category: "Bookings",
    question: "Where do I find worker contacts?",
    answer:
      "After payment is verified, worker contacts appear in Hires and on eligible tracking pages. Contacts stay hidden before confirmation and payment to protect both salons and providers.",
  },
  {
    category: "Accounts",
    question: "Can I request deletion or correction of my data?",
    answer:
      "Yes. Email support with your account email and request access, correction, or deletion of your account and associated data.",
  },
];

export function HelpPageClient() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");

  const filteredFaqs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return faqs.filter((faq) => {
      const matchesCategory = category === "All" || faq.category === category;
      const matchesQuery =
        !normalizedQuery ||
        `${faq.category} ${faq.question} ${faq.answer}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-3">
        <ContactCard
          href={whatsappHref}
          icon={<Phone className="h-4 w-4" />}
          label="WhatsApp"
          value={supportPhone}
        />
        <ContactCard
          href={`tel:${supportPhone}`}
          icon={<Phone className="h-4 w-4" />}
          label="Call"
          value={supportPhone}
        />
        <ContactCard
          href={`mailto:${supportEmail}`}
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          value={supportEmail}
        />
      </section>

      <section className="rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search FAQs</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search bookings, deposits, refunds, workers..."
              value={query}
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {categories.map((item) => (
              <button
                className={cn(
                  "h-9 flex-none rounded-md border px-3 text-sm font-bold transition",
                  item === category
                    ? "border-transparent bg-[color:var(--foreground)] text-white"
                    : "border-[color:var(--border)] bg-white text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]",
                )}
                key={item}
                onClick={() => setCategory(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <div className="space-y-3 rounded-lg border border-[color:var(--border)] bg-white p-4 lg:sticky lg:top-24">
          <h2 className="text-base font-extrabold text-[color:var(--foreground)]">
            Popular topics
          </h2>
          <Topic icon={<CalendarCheck />} title="Booking review" value="Admin confirms availability first" />
          <Topic icon={<WalletCards />} title="Deposits" value="Secure workers before assignment" />
          <Topic icon={<Users />} title="Worker contacts" value="Unlocked after verified payment" />
          <Topic icon={<ShieldCheck />} title="Data requests" value="Email support for account data" />
          <Topic icon={<Banknote />} title="Refund review" value="Handled by admin case review" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-[color:var(--foreground)]">
              FAQs
            </h2>
            <p className="text-sm font-bold text-[color:var(--muted-foreground)]">
              {filteredFaqs.length} result{filteredFaqs.length === 1 ? "" : "s"}
            </p>
          </div>

          {filteredFaqs.length ? (
            filteredFaqs.map((faq) => (
              <details
                className="group rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm"
                key={faq.question}
              >
                <summary className="cursor-pointer list-none text-base font-extrabold text-[color:var(--foreground)]">
                  <span className="mr-2 inline-flex rounded-md bg-[color:var(--muted)] px-2 py-1 text-xs font-bold text-[color:var(--muted-foreground)]">
                    {faq.category}
                  </span>
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
                  {faq.answer}
                </p>
              </details>
            ))
          ) : (
            <div className="rounded-lg border border-[color:var(--border)] bg-white p-5 text-sm font-semibold leading-6 text-[color:var(--muted-foreground)]">
              No FAQs matched your search. Contact support and include your booking
              reference if you have one.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ContactCard({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <a
      className="rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      href={href}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      target={href.startsWith("http") ? "_blank" : undefined}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)]">
        {icon}
      </span>
      <span className="mt-3 block text-sm font-bold uppercase text-[color:var(--muted-foreground)]">
        {label}
      </span>
      <span className="mt-1 block break-words text-base font-extrabold text-[color:var(--foreground)]">
        {value}
      </span>
      <span className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-3")}>
        Contact now
      </span>
    </a>
  );
}

function Topic({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-md bg-[color:var(--muted)] p-3">
      <span className="mt-0.5 text-[color:var(--accent)] [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <div>
        <p className="text-sm font-extrabold text-[color:var(--foreground)]">
          {title}
        </p>
        <p className="text-xs font-semibold leading-5 text-[color:var(--muted-foreground)]">
          {value}
        </p>
      </div>
    </div>
  );
}
