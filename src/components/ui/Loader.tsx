"use client";

import { useEffect, useState } from "react";

const SEEN = "bb-loaded"; // sessionStorage key: the loader plays once per visit
const MIN_MS = 2600; // let the drawing finish even when the page is already cached
const MAX_MS = 7000; // never hold anyone hostage on a slow connection
const CRYSTAL = true; // the blue crystal that forms at the end; set false for just the tile

/**
 * First-visit loader: the Br tile draws itself on paper (pencil guides, carved ink outline, green fill, then the
 * symbol and its numbers), a blue crystal forms on its corner, and it lifts away once the hero art has loaded.
 * A tiny inline script hides it before first paint on repeat visits; reduced motion jumps to the finished tile.
 */
export function Loader() {
  const [state, setState] = useState<"on" | "out" | "gone">("on");

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(SEEN) === "1"; } catch {}
    if (seen) return; // already hidden by the inline script + CSS (html[data-loaded])
    const html = document.documentElement;
    html.style.overflow = "hidden"; // no scrolling the page underneath while it cooks
    const t0 = performance.now();
    const loaded = new Promise<void>((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", () => r(), { once: true })));
    const fonts = document.fonts?.ready ?? Promise.resolve();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      html.style.overflow = "";
      try { sessionStorage.setItem(SEEN, "1"); } catch {}
      setState("out");
      setTimeout(() => setState("gone"), 650);
    };
    Promise.all([loaded, fonts]).then(() => setTimeout(finish, Math.max(0, MIN_MS - (performance.now() - t0))));
    const cap = setTimeout(finish, MAX_MS);
    return () => { clearTimeout(cap); html.style.overflow = ""; };
  }, []);

  if (state === "gone") return null;
  return (
    <>
      {/* runs while the HTML parses, before first paint: repeat visits never see a flash of the loader */}
      <script dangerouslySetInnerHTML={{ __html: `try{sessionStorage.getItem("${SEEN}")==="1"&&document.documentElement.setAttribute("data-loaded","")}catch(e){}` }} />
      <div
        role="status"
        aria-label="Loading"
        className={`bb-loader fixed inset-0 z-[100] grid place-items-center bg-paper transition-[opacity,scale] duration-500 ${state === "out" ? "pointer-events-none scale-105 opacity-0" : ""}`}
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
