import { HelpPageClient } from "@/components/help/help-page-client";
import { UtilityPage } from "@/components/shared/utility-page";

export default function HelpPage() {
  return (
    <UtilityPage
      eyebrow="Support"
      title="Help & FAQs"
      description="Answers and support information for Beauty Connect users."
      className="max-w-6xl"
    >
      <HelpPageClient />
    </UtilityPage>
  );
}
