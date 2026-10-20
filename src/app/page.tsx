import { FuseTimeline } from "@/components/fuse/FuseTimeline";
import { Prizes } from "@/components/fuse/Prizes";
import { Classroom } from "@/components/classroom/Classroom";
import { Sponsors } from "@/components/sponsors/Sponsors";
import { Faq } from "@/components/faq/Faq";
import { Finale } from "@/components/finale/Finale";
import { Story } from "@/components/story/Story";
import { SmoothScroll } from "@/components/scene/SmoothScroll";
import { TopBar } from "@/components/ui/TopBar";

export default function Home() {
  return (
    <>
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
    </>
  );
}
