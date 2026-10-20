"use client";

import { useEffect, useState } from "react";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const PHRASE = "saymyname";

const RV = String.raw`
        ____________________________
       |  _   _   _   _   _   |  |  |\
       | |_| |_| |_| |_| |_|  |  |  ||
   ____|______________________|__|__||___
  |  ___                         ___     |
  |_/ o \_______________________/ o \____|
      '-'                         '-'
`;

/**
 * Small things for the people who poke around (it's a hackathon: they will):
 *   type "say my name"  → Heisenberg.
 *   ↑↑↓↓←→←→ B A        → blacklight mode (toggle)
 *   devtools console    → an RV and a wink at /.well-known/security.txt
 * Keys typed into inputs never count. Nothing here does anything but decorate.
 */
export function EasterEggs() {
  const [heisenberg, setHeisenberg] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    console.log(
      `%c${RV}%c\n  Looking for the recipe? It's not in the bundle.\n  Every rule lives on the server. Found a hole anyway? /.well-known/security.txt\n`,
      "color:#13c8e8;font-family:monospace",
      "color:#c8743a;font-family:monospace",
    );
    try {
      if (sessionStorage.getItem("bb-blacklight") === "1") document.documentElement.classList.add("blacklight");
    } catch {}

    let typed = "";
    let pos = 0;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      // Konami
      pos = e.key === KONAMI[pos] || e.key.toLowerCase() === KONAMI[pos] ? pos + 1 : e.key === KONAMI[0] ? 1 : 0;
      if (pos === KONAMI.length) {
        pos = 0;
        const on = document.documentElement.classList.toggle("blacklight");
        try { sessionStorage.setItem("bb-blacklight", on ? "1" : "0"); } catch {}
        setToast(on ? "Blacklight on. Everything glows." : "Blacklight off.");
      }
      // say my name
      if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
        typed = (typed + e.key.toLowerCase()).slice(-PHRASE.length);
        if (typed === PHRASE) {
          typed = "";
          setHeisenberg((n) => n + 1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <>
      {heisenberg > 0 && (
        <div key={heisenberg} aria-live="polite" className="egg-heisenberg pointer-events-none fixed inset-0 z-[90] grid place-items-center" onAnimationEnd={(e) => e.target === e.currentTarget && setHeisenberg(0)}>
          <div className="text-center">
            <p className="egg-stamp inline-block border-[6px] border-ink bg-paper px-6 py-2 font-display text-[clamp(2.5rem,9vw,7rem)] uppercase leading-none text-ink">Heisenberg.</p>
            <p className="egg-right mt-4 font-type text-lg text-paper [text-shadow:2px_2px_0_var(--color-ink)]">You&apos;re goddamn right.</p>
          </div>
        </div>
      )}
      {toast && (
        <p role="status" className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 border-[3px] border-ink bg-ink px-4 py-2 font-type text-sm text-crystal print-shadow">
          {toast}
        </p>
      )}
    </>
  );
}
