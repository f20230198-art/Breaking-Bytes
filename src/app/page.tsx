import { HeroScene } from "@/components/hero/HeroScene";
import { SmoothScroll } from "@/components/scene/SmoothScroll";
import { TopBar } from "@/components/ui/TopBar";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <TopBar />
      <main>
        <HeroScene />
      </main>
    </>
  );
}
