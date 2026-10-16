/* eslint-disable @next/next/no-img-element -- full-bleed strip, pre-optimised WebP */
import { singles } from "@/scenes/config";

const dirt = singles["lab/dirt"];

/** Between the desert and the lab: one screen of earth scrolls past, ending on the lab's concrete ceiling. */
export function Descent() {
  return (
    // the strip's own ceiling slab (bottom ~22%) is cropped: the lab scene brings its own ceiling, so we never show two
    <section aria-hidden className="relative h-[78vh] overflow-hidden bg-ink">
      <img src={dirt.src} alt="" width={dirt.width} height={dirt.height} loading="lazy" decoding="async" draggable={false} className="absolute inset-x-0 top-0 h-screen w-full select-none object-cover object-top" />
    </section>
  );
}
