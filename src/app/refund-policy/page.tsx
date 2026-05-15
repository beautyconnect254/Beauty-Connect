import { LegalDocument, type LegalSection } from "@/components/shared/legal-document";
import { UtilityPage } from "@/components/shared/utility-page";

const sections: LegalSection[] = [
  {
    title: "1. Introduction",
    body: [
      "This Refund Policy explains conditions under which refunds may be issued for bookings on Beauty Connect.",
    ],
  },
  {
    title: "2. Deposit Payments",
    body: ["A deposit is required to confirm bookings and reserve service providers."],
  },
  {
    title: "3. Eligibility for Refund",
    body: ["Refunds may be issued only under the following conditions:"],
    bullets: [
      "Booking was not confirmed by the admin.",
      "Service provider was unavailable and no replacement was provided.",
      "Duplicate or erroneous payment occurred.",
    ],
  },
  {
    title: "4. Non-Refundable Cases",
    body: ["Refunds will not be issued when:"],
    bullets: [
      "A booking has been confirmed and workers assigned.",
      "The service has already started or been completed.",
      "Cancellation occurs after payment confirmation.",
    ],
  },
  {
    title: "5. Processing Time",
    body: [
      "Approved refunds may take 3-7 business days depending on the payment provider.",
    ],
  },
  {
    title: "6. Payment Disputes",
    body: ["Users must report payment issues promptly for investigation."],
  },
  {
    title: "7. Admin Review",
    body: [
      "All refund decisions are subject to review by the Beauty Connect administration team.",
    ],
  },
  {
    title: "8. Contact",
    body: ["Support Email: beautyconnect254@gmail.com"],
  },
];

export default function RefundPolicyPage() {
  return (
    <UtilityPage
      eyebrow="Payments"
      title="Refund Policy"
      description="Refund guidance for deposits, bookings, and hiring payments."
    >
      <LegalDocument lastUpdated="May 2026" sections={sections} />
    </UtilityPage>
  );
}
