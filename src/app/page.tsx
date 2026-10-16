import { HeroScene } from "@/components/hero/HeroScene";
import { Descent } from "@/components/lab/Descent";
import { LabScene } from "@/components/lab/LabScene";
import { SmoothScroll } from "@/components/scene/SmoothScroll";
import { TopBar } from "@/components/ui/TopBar";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <TopBar />
      <main>
        <HeroScene />
        <Descent />
        <LabScene />
      </main>
    </>
  );
}
