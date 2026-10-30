import { FuseTimeline } from "@/components/fuse/FuseTimeline";
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

// dates, schedule, prizes and FAQ come from the database (cached ~1 min; built-in fallback if unreachable).
// The sponsors section (components/sponsors/Sponsors) is hidden until sponsors are confirmed; add <Sponsors /> back after <Classroom />.
// The prizes section (components/fuse/Prizes) is hidden too; to bring it back, add <Prizes /> after <FuseTimeline /> and
// restore Classroom's -mt-[100vh] (it slides up over the prize print's last screen).
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
        <Classroom />
        <Faq />
      </main>
      <Finale />
    </SiteProvider>
  );
}
