import { FuseTimeline } from "@/components/fuse/FuseTimeline";
import { Prizes } from "@/components/fuse/Prizes";
import { Sponsors } from "@/components/sponsors/Sponsors";
import { Classroom } from "@/components/classroom/Classroom";
import { Faq } from "@/components/faq/Faq";
import { Finale } from "@/components/finale/Finale";
import { Story } from "@/components/story/Story";
import { SmoothScroll } from "@/components/scene/SmoothScroll";
import { Loader } from "@/components/ui/Loader";
import { TopBar } from "@/components/ui/TopBar";
import { SiteProvider } from "@/components/site/SiteContext";
import { getSite } from "@/lib/siteContent";

// the page is still prerendered and revalidated; this only silences the dev-time "instant navigation" check, which
// flags the cached content read when you navigate here from the dashboard
export const instant = false;

// dates, schedule, prizes, sponsors and FAQ come from the database (cached ~1 min; built-in fallback if unreachable).
// Sponsors renders nothing while there are no visible sponsors. Classroom slides up over the prize office's last screen.
export default async function Home() {
  const site = await getSite();
  return (
    <SiteProvider value={site}>
      <Loader />
      <SmoothScroll />
      <TopBar />
      <main>
        <Story />
        <FuseTimeline />
        <Prizes />
        <Classroom />
        <Sponsors />
        <Faq />
      </main>
      <Finale />
    </SiteProvider>
  );
}
