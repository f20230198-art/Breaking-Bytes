"use client";

import { useSyncExternalStore } from "react";

function split(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const pad = (n: number) => String(n).padStart(2, "0");

// one shared 1s ticker for every countdown on the page; null on the server so SSR shows placeholders
const listeners = new Set<() => void>();
let ticker: ReturnType<typeof setInterval> | undefined;
function subscribeClock(cb: () => void) {
  listeners.add(cb);
  ticker ??= setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(cb);
    if (!listeners.size) { clearInterval(ticker); ticker = undefined; }
  };
}
const clockNow = () => Math.floor(Date.now() / 1000) * 1000;

/**
 * Display-only countdown. The server clock is the authority for any real deadline; pass `offsetMs` (server minus
 * client, see useServerOffset) so a wrong device clock can't make it lie.
 */
export function Countdown({ to, label = "Time until the cook", compact = false, offsetMs = 0, urgent = false }: { to: string; label?: string; compact?: boolean; offsetMs?: number; urgent?: boolean }) {
  const now = useSyncExternalStore(subscribeClock, clockNow, () => null);
  const left = now === null ? null : new Date(to).getTime() - (now + offsetMs);
  const t = left === null ? null : split(left);
  const hot = urgent && left !== null && left > 0 && left < 3600_000; // the last hour pulses red
  const cells = t ? [["days", t.d], ["hrs", t.h], ["min", t.m], ["sec", t.s]] : [["days", 0], ["hrs", 0], ["min", 0], ["sec", 0]];

  if (compact) {
    return (
      <span className={`font-type tabular-nums ${hot ? "animate-pulse text-siren" : "text-crystal"}`} aria-label={label}>
        {t ? `${t.d}d ${pad(t.h)}:${pad(t.m)}:${pad(t.s)}` : "--d --:--:--"}
      </span>
    );
  }

  return (
    <div className="carved inline-block bg-ink px-4 py-3 print-shadow" role="timer" aria-label={label}>
      <div className="font-type text-[11px] uppercase tracking-[0.25em] text-paper-dim">{label}</div>
      <div className="mt-1 flex gap-3">
        {cells.map(([u, v]) => (
          <div key={u as string} className="text-center">
            <div className={`font-display text-3xl tabular-nums leading-none md:text-4xl ${hot ? "animate-pulse text-siren" : "text-crystal drop-shadow-[0_0_10px_rgba(19,200,232,0.55)]"}`}>
              {t ? pad(v as number) : "--"}
            </div>
            <div className="mt-1 font-type text-[10px] uppercase tracking-widest text-paper-dim">{u}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
