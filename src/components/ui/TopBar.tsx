"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSite } from "@/components/site/SiteContext";
import { CLUB } from "@/data/site";
import { Countdown } from "./Countdown";

export function TopBar() {
  // the finale carries both logos itself, so the bar slides away while it's on screen
  const [away, setAway] = useState(false);
  const { startsAt } = useSite();
  useEffect(() => {
    const end = document.getElementById("register");
    if (!end) return;
    const io = new IntersectionObserver(([e]) => setAway(e.isIntersecting), { threshold: 0.25 });
    io.observe(end);
    return () => io.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 px-4 py-3 transition-[translate,opacity] duration-300 md:px-8 ${away ? "pointer-events-none -translate-y-full opacity-0" : ""}`}
    >
      <div className="flex items-center gap-3">
      <a href={CLUB.links.website} target="_blank" rel="noreferrer" aria-label={CLUB.name} className="grid size-9 place-items-center rounded-full bg-paper p-1 print-shadow">
        <Image src="/assets/logo/gdg-mark.png" alt="" width={28} height={20} className="h-auto w-7" />
      </a>
      <Link href="/" className="flex items-center gap-1.5 font-display text-lg text-paper [text-shadow:2px_2px_0_#111]">
        <span className="grid size-8 place-items-center border-2 border-ink bg-olive text-sm text-paper">Br</span>
        <span className="hidden sm:inline">Breaking Bytes</span>
      </Link>
      </div>
      <div className="flex items-center gap-3">
        {/* phones too: the countdown is the one thing everyone checks */}
        <span className="bg-ink/80 px-1.5 py-1 text-[10px] sm:px-2 sm:text-xs">
          <Countdown to={startsAt} compact />
        </span>
        <Link
          href="/dashboard"
          className="border-2 border-ink bg-crystal px-3 py-1.5 font-display text-xs uppercase tracking-wide text-ink print-shadow transition-colors hover:bg-paper"
        >
          Pre-register
        </Link>
      </div>
    </header>
  );
}
