"use client";
/* eslint-disable @next/next/no-img-element -- scene layers are pre-optimised WebP that must stack pixel-exact */

import { motion, useTransform } from "motion/react";
import { useState } from "react";
import { PeriodicTitle } from "@/components/comic/PeriodicTitle";
import { PinnedScene, PushIn } from "@/components/scene/PinnedScene";
import { SceneCanvas, bboxStyle } from "@/components/scene/SceneCanvas";
import { Countdown } from "@/components/ui/Countdown";
import { StampButton } from "@/components/ui/StampButton";
import { EVENT } from "@/data/site";
import { sceneAssets } from "@/scenes/config";

const rv = sceneAssets("s1-desert").layers.find((l) => l.id === "rv")!;
const cutaway = sceneAssets("s1-desert").layers.find((l) => l.id === "rv-cutaway")!;

/** ① The Desert: hero. Hover/tap the RV to cut its wall away and see the cook inside. */
export function DesertScene() {
  const [open, setOpen] = useState(false);
  return (
    <PinnedScene id="desert" label="The desert" length={2.2}>
      {(p) => <Inner progress={p} open={open} setOpen={setOpen} />}
    </PinnedScene>
  );
}

function Inner({ progress, open, setOpen }: { progress: import("motion/react").MotionValue<number>; open: boolean; setOpen: (v: boolean) => void }) {
  const uiOpacity = useTransform(progress, [0, 0.35], [1, 0]);
  const uiY = useTransform(progress, [0, 0.35], [0, -80]);
  const hintOpacity = useTransform(progress, [0, 0.08], [1, 0]);
  const fade = useTransform(progress, [0.75, 1], [0, 1]);

  return (
    <>
      <PushIn progress={progress} to={1.35} origin="68% 60%">
        <SceneCanvas
          scene="s1-desert"
          priority
          layerStyle={{
            // the cutaway layer sits exactly on the RV (and under the chairs); its wall "slides away" left→right
            "rv-cutaway": {
              clipPath: open ? "inset(0 0 0 0)" : `inset(0 ${100 - cutaway.bbox![0] * 100}% 0 ${cutaway.bbox![0] * 100}%)`,
              transition: "clip-path 700ms cubic-bezier(.7,0,.2,1)",
            },
          }}
        >
          <button
            type="button"
            aria-label={open ? "Close the RV" : "Look inside the RV"}
            aria-pressed={open}
            onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
            onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
            onClick={() => setOpen(!open)}
            className="absolute cursor-zoom-in rounded-[8%] focus-visible:outline-2 focus-visible:outline-crystal"
            style={bboxStyle(rv.bbox!)}
          />
        </SceneCanvas>
      </PushIn>

      <motion.div style={{ opacity: uiOpacity, y: uiY }} className="pointer-events-none absolute inset-0 flex flex-col justify-between px-5 pb-10 pt-24 md:px-14 md:pt-28">
        <div className="max-w-[46rem]">
          <p className="mb-3 font-type text-sm uppercase tracking-[0.3em] text-ink">A 24-hour hackathon · {EVENT.venue}</p>
          <PeriodicTitle className="text-[clamp(3rem,9vw,7.5rem)]" />
          <p className="mt-4 inline-block bg-ink px-3 py-1 font-display text-sm uppercase tracking-[0.35em] text-hazmat md:text-base">
            {EVENT.tagline}
          </p>
        </div>
        <div className="pointer-events-auto flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-4">
            <Countdown to={EVENT.startsAt} />
            <StampButton href="/dashboard">Enter the lab</StampButton>
          </div>
          <motion.p style={{ opacity: hintOpacity }} className="hidden self-end bg-ink/80 px-3 py-1.5 font-type text-sm text-paper md:mr-24 md:block">
            Hover the RV. Then scroll to descend ↓
          </motion.p>
        </div>
      </motion.div>

      {/* sink into the ground before the dig-down transition */}
      <motion.div style={{ opacity: fade }} className="pointer-events-none absolute inset-0 bg-ink" />
    </>
  );
}
