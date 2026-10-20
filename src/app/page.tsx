import { FuseTimeline } from "@/components/fuse/FuseTimeline";
import { Prizes } from "@/components/fuse/Prizes";
import { Classroom } from "@/components/classroom/Classroom";
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
      </main>
    </>
  );
}
