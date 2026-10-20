/* eslint-disable @next/next/no-img-element -- a single full-bleed print */
import Link from "next/link";

export const metadata = { title: "404 · Breaking Bytes" };

/** "Jesse, we have to 404." A lone sneaker by the road: whoever was here, they're gone. */
export default function NotFound() {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-ink px-4 text-paper">
      <img src="/scenes/extras/404.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(17,17,17,0.15),rgba(17,17,17,0.6))]" />
      <div className="relative -mt-[18vh] text-center">
        <p className="font-display text-[clamp(4rem,14vw,9rem)] leading-none text-paper [paint-order:stroke_fill] [-webkit-text-stroke:0.08em_var(--color-ink)] [text-shadow:0.06em_0.06em_0_var(--color-ink)]">404</p>
        <h1 className="mt-2 font-display text-[clamp(1.4rem,4vw,2.4rem)] text-paper [text-shadow:2px_2px_0_var(--color-ink)]">Jesse, we have to 404.</h1>
        <p className="mx-auto mt-2 max-w-sm bg-ink/80 px-3 py-1 font-type text-sm">This page got cooked. Nothing out here but tyre tracks.</p>
        <Link href="/" className="mt-6 inline-block border-[3px] border-ink bg-crystal px-6 py-3 font-display uppercase tracking-wider text-ink print-shadow">
          Back to the RV
        </Link>
      </div>
    </main>
  );
}
