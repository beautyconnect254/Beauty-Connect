import { LegalDocument, type LegalSection } from "@/components/shared/legal-document";
import { UtilityPage } from "@/components/shared/utility-page";

const sections: LegalSection[] = [
  {
    title: "1. Introduction",
    body: [
      "This Privacy Policy explains how Beauty Connect collects, uses, and protects user data.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: ["We may collect the following information:"],
    bullets: [
      "Name",
      "Email address",
      "Phone number, if provided",
      "Google account basic profile information, if Google Sign-In is used",
      "Location information",
      "Booking and service request data",
      "Application usage data",
      "We do not collect passwords directly when using Google OAuth authentication.",
    ],
  },
  {
    title: "3. How We Use Data",
    body: ["We use data to:"],
    bullets: [
      "Enable user authentication and login",
      "Process booking requests",
      "Match users with service providers",
      "Manage booking confirmation and payment flow",
      "Improve platform performance and reliability",
    ],
  },
  {
    title: "4. Google User Data",
    body: ["If you sign in using Google:"],
    bullets: [
      "We only access basic profile information, including name, email, and profile picture.",
      "We do not access Gmail content or sensitive Google data.",
      "Google data is used only for authentication and account identification.",
    ],
  },
  {
    title: "5. Data Storage",
    body: ["User data is securely stored in our database system, such as Supabase."],
  },
  {
    title: "6. Data Sharing",
    body: ["We do not sell user data. Data may be shared only when required to:"],
    bullets: [
      "Assign workers to bookings",
      "Process payments via third-party providers",
      "Comply with legal obligations",
    ],
  },
  {
    title: "7. Data Security",
    body: [
      "We implement reasonable technical and organizational security measures to protect user data.",
    ],
  },
  {
    title: "8. User Rights",
    body: ["Users may request:"],
    bullets: [
      "Access to their data",
      "Correction of data",
      "Deletion of their account and associated data",
    ],
  },
  {
    title: "9. Third Party Services",
    body: ["We use trusted third-party services including:"],
    bullets: [
      "Google OAuth for authentication",
      "Payment providers, such as mobile money or card processors",
      "Hosting services, such as Vercel",
      "Database services, such as Supabase",
    ],
  },
  {
    title: "10. Contact",
    body: ["For privacy concerns, contact: beautyconnect254@gmail.com"],
  },
];

export default function PrivacyPage() {
  return (
    <UtilityPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="How Beauty Connect handles account and booking information."
    >
      <LegalDocument lastUpdated="May 2026" sections={sections} />
    </UtilityPage>
  );
}
