import { HomePage } from "@/components/home/home-page";
import { SiteShell } from "@/components/layout/site-shell";
import { getFeaturedWorkers, getWorkerCategories } from "@/lib/data-access";

export default function Page() {
  return (
    <SiteShell>
      <HomePage
        featuredWorkers={getFeaturedWorkers()}
        categories={getWorkerCategories()}
      />
    </SiteShell>
  );
}
