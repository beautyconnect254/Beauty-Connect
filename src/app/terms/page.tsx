import { LegalDocument, type LegalSection } from "@/components/shared/legal-document";
import { UtilityPage } from "@/components/shared/utility-page";

const sections: LegalSection[] = [
  {
    title: "1. Introduction",
    body: [
      'These Terms and Conditions govern your use of Beauty Connect ("the Platform").',
      "Beauty Connect is a booking platform that connects users with independent beauty service providers including barbers, hair stylists, nail technicians, and related professionals.",
      "By using the Platform, you agree to these Terms.",
    ],
  },
  {
    title: "2. Platform Role",
    body: ["Beauty Connect acts as an intermediary platform that:"],
    bullets: [
      "Displays available service providers",
      "Facilitates booking requests",
      "Enables admin review and confirmation of bookings",
      "Supports payment deposit processing before final assignment",
      "Beauty Connect does not directly employ service providers unless explicitly stated.",
    ],
  },
  {
    title: "3. User Accounts",
    body: [
      "Users may be required to authenticate using third-party login providers such as Google OAuth.",
      "You are responsible for maintaining the security of your account access.",
    ],
  },
  {
    title: "4. Booking Process",
    body: ["The booking flow is as follows:"],
    bullets: [
      "A user submits a booking request, either for a single worker or a team.",
      "Admin reviews availability and confirms booking.",
      "The user is required to pay a deposit to proceed.",
      "Once payment is confirmed, the booking is finalized and workers are assigned.",
    ],
  },
  {
    title: "5. Payments",
    bullets: [
      "Deposits are required to secure bookings.",
      "Payment confirms allocation of requested workers.",
      "Payments are processed via third-party payment providers.",
      "Beauty Connect does not store full payment card details.",
    ],
  },
  {
    title: "6. Worker Availability",
    body: [
      "All workers are independent service providers and availability is not guaranteed until confirmed by the admin system.",
    ],
  },
  {
    title: "7. Cancellations and Refunds",
    body: ["Cancellations and refunds are governed by the Refund Policy."],
  },
  {
    title: "8. Prohibited Use",
    body: [
      "Users must not misuse the platform, including fraudulent bookings or abuse of the system.",
    ],
  },
  {
    title: "9. Limitation of Liability",
    body: ["Beauty Connect is not liable for:"],
    bullets: [
      "Service delivery outcomes by independent workers",
      "Delays caused by availability or external factors",
      "Payment processing issues from third-party providers",
    ],
  },
  {
    title: "10. Changes to Terms",
    body: [
      "We may update these Terms from time to time. Continued use of the Platform constitutes acceptance of updated Terms.",
    ],
  },
  {
    title: "11. Contact",
    body: ["Support Email: beautyconnect254@gmail.com"],
  },
];

export default function TermsPage() {
  return (
    <UtilityPage
      eyebrow="Legal"
      title="Terms & Conditions"
      description="Terms for using Beauty Connect services."
    >
      <LegalDocument lastUpdated="May 2026" sections={sections} />
    </UtilityPage>
  );
}
