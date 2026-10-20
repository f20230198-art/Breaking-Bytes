"use client";

import { useEffect, useState } from "react";

const SEEN = "bb-loaded"; // sessionStorage key: the loader plays once per visit
const DRAW_MS = 2700; // the drawing's length (see the ld-* animations in globals.css); it always gets to finish
const MAX_MS = 7000; // never hold anyone hostage on a slow connection
const CRYSTAL = true; // the blue crystal that forms at the end; set false for just the tile

/**
 * First-visit loader: the Br tile draws itself on paper (pencil guides, carved ink outline, green fill, then the
 * symbol and its numbers), a blue crystal forms on its corner, and it lifts away once the hero art has loaded.
 * A tiny inline script hides it before first paint on repeat visits; reduced motion jumps to the finished tile.
 *
 * Smoothness: the drawing is animated on the main thread, so it waits until the page has hydrated and the display font
 * has arrived (nothing else then competes with it), the page underneath stays unpainted (html[data-loading]), and
 * scene warm-up waits for "bb:ready". On the way out the page is shown first, then the paper fades off it.
 */
export function Loader() {
  const [state, setState] = useState<"wait" | "draw" | "out" | "gone">("wait");

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(SEEN) === "1"; } catch {}
    if (seen) return; // already hidden by the inline script + CSS (html[data-loaded])
    const html = document.documentElement;
    html.setAttribute("data-loading", ""); // the inline script normally set this already
    html.style.overflow = "hidden"; // no scrolling the page underneath while it cooks
    const frame = () => new Promise<number>((r) => requestAnimationFrame(r));
    const idle = () => new Promise<void>((r) => ("requestIdleCallback" in window ? requestIdleCallback(() => r(), { timeout: 600 }) : setTimeout(r, 50)));
    // resolves once the main thread is quiet again: a few back-to-back quick frames (or after 2 s regardless)
    const settled = async () => {
      const until = performance.now() + 2000;
      let quick = 0, last = await frame();
      while (quick < 4 && performance.now() < until) {
        const t = await frame();
        quick = t - last < 22 ? quick + 1 : 0;
        last = t;
      }
    };
    const loaded = new Promise<void>((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", () => r(), { once: true })));
    const fonts = document.fonts?.ready ?? Promise.resolve();
    let done = false, alive = true;
    const finish = async () => {
      if (done) return;
      done = true;
      html.style.overflow = "";
      try { sessionStorage.setItem(SEEN, "1"); } catch {}
      html.removeAttribute("data-loading"); // paint the page under the still-opaque (finished) tile first...
      await settled(); // ...wait out that first, heavy paint of the hero...
      if (!alive) return;
      setState("out"); // ...then fade the paper off it (a compositor-only opacity fade, see will-change below)
      setTimeout(() => {
        setState("gone");
        window.dispatchEvent(new Event("bb:ready"));
      }, 600);
    };
    (async () => {
      await fonts;
      await idle(); await settled(); // hydration's work is done; the stage is quiet
      if (!alive) return;
      setState("draw");
      const t0 = performance.now();
      await loaded;
      // reduced motion shows the finished tile at once, so there is no drawing to wait for
      const draw = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 600 : DRAW_MS;
      setTimeout(finish, Math.max(0, draw - (performance.now() - t0)));
    })();
    const cap = setTimeout(finish, MAX_MS);
    return () => { alive = false; clearTimeout(cap); html.style.overflow = ""; html.removeAttribute("data-loading"); };
  }, []);

  if (state === "gone") return null;
  return (
    <>
      {/* runs while the HTML parses, before first paint: repeat visits never see a flash of the loader */}
      <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.setAttribute(sessionStorage.getItem("${SEEN}")==="1"?"data-loaded":"data-loading","")}catch(e){}` }} />
      <div
        role="status"
        aria-label="Loading"
        className={`bb-loader fixed inset-0 z-[100] grid place-items-center bg-paper transition-opacity duration-500 will-change-[opacity] ${state === "wait" ? "" : "go"} ${state === "out" ? "pointer-events-none opacity-0" : ""}`}
      >
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 140 140" className="w-[min(46vw,15rem)] overflow-visible" aria-hidden>
            {/* pencil guides: two loose, slightly-off squares */}
            <rect className="ld-pencil" x="17" y="19" width="104" height="103" pathLength={100} />
            <rect className="ld-pencil" style={{ animationDelay: "0.18s" }} x="21" y="16" width="101" height="105" pathLength={100} />
            {/* the green fill floods up from the bottom */}
            <rect className="ld-fill" x="20" y="20" width="100" height="100" />
            {/* carved ink outline */}
            <rect className="ld-ink" x="20" y="20" width="100" height="100" pathLength={100} />
            {/* the symbol: inked on, then filled with paper */}
            <text className="ld-text" x="70" y="91" textAnchor="middle">Br</text>
            <text className="ld-num" x="28" y="36">35</text>
            <text className="ld-num" x="112" y="36" textAnchor="end">79.904</text>
            <text className="ld-num" x="70" y="112" textAnchor="middle">Bromine</text>
            {CRYSTAL && (
              <g className="ld-crystal">
                <polygon points="118,14 126,24 121,38 112,30" />
                <polygon points="126,24 136,20 133,34 121,38" />
                <polygon points="112,30 121,38 115,44 106,38" />
              </g>
            )}
          </svg>
          <p className="ld-caption mt-6 font-type text-sm uppercase tracking-[0.4em] text-ink/70">Cooking</p>
        </div>
      </div>
    </>
  );
}
