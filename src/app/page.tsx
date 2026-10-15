import { DesertScene } from "@/components/hero/DesertScene";
import {
  CarWashScene,
  ClassroomScene,
  DigDown,
  MoneyScene,
  NightScene,
  PollosScene,
  SaulScene,
  SuperlabScene,
} from "@/components/hero/StoryScenes";
import { SmoothScroll } from "@/components/scene/SmoothScroll";
import { PurityMeter } from "@/components/ui/PurityMeter";
import { TopBar } from "@/components/ui/TopBar";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <TopBar />
      <PurityMeter />
      <main>
        <DesertScene />
        <DigDown />
        <SuperlabScene />
        <ClassroomScene />
        <MoneyScene />
        <CarWashScene />
        <PollosScene />
        <SaulScene />
        <NightScene />
      </main>
      <footer className="bg-ink px-5 py-10 font-type text-xs text-paper/60 md:px-14">
        <p>Breaking Bytes — The Underground Hackathon. A fan-made parody theme; not affiliated with AMC or Sony Pictures Television.</p>
        <p className="mt-1">No chemistry teachers were harmed in the making of this website.</p>
      </footer>
    </>
  );
}
