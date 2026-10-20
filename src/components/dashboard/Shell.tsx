"use client";
/* eslint-disable @next/next/no-img-element -- a tiny pre-blurred backdrop; next/image adds nothing here */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Countdown } from "@/components/ui/Countdown";
import { nextMilestone, useLab } from "./LabProvider";

const TABS = [
  ["/dashboard", "Overview"],
  ["/dashboard/crew", "Crew"],
  ["/dashboard/formula", "Formula"],
  ["/dashboard/submit", "Dead Drop"],
  ["/dashboard/profile", "Profile"],
] as const;

/**
 * The lab's frame. The backdrop is your side of the prize print, blurred like a phone home screen: Saul's office for
 * Walters, Jesse and Flynn's place for Jesses (pre-blurred files, so no live blur filter costs frames).
 */
export function Shell({ children }: { children: ReactNode }) {
  const { me, crew, cfg, offset, now } = useLab();
  const path = usePathname();
  const next = nextMilestone(cfg, now());

  return (
    // isolate: its own stacking context, so the -z-10 backdrop sits behind the content but above the layout's ink
    <div className="relative isolate min-h-svh text-paper">
      <img src={`/scenes/dashboard/${me.category}.webp`} alt="" aria-hidden className="fixed inset-0 -z-10 h-full w-full scale-110 object-cover" />
      <div aria-hidden className="fixed inset-0 -z-10 bg-ink/55" />

      <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-ink/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 font-display text-paper" aria-label="Breaking Bytes home">
            <span className="grid size-8 place-items-center border-2 border-ink bg-olive text-sm">Br</span>
            <span className="hidden sm:inline">The Lab</span>
          </Link>
          {crew && <InviteCode crew={crew.name} code={crew.invite_code} />}
          <div className="ml-auto text-right">
            {next ? (
              <>
                <p className="font-type text-[10px] uppercase tracking-[0.25em] text-paper-dim">{next.label}</p>
                <Countdown to={next.at} offsetMs={offset} compact urgent={next.deadline} label={next.label} />
              </>
            ) : (
              <p className="font-stencil text-sm font-bold uppercase tracking-[0.25em] text-siren">The cook is over</p>
            )}
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 sm:px-4" aria-label="Dashboard">
          {TABS.map(([href, label]) => {
            const on = href === "/dashboard" ? path === href : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={`shrink-0 border-b-4 px-3 py-2 font-display text-xs uppercase tracking-wider transition-colors ${on ? "border-crystal text-paper" : "border-transparent text-paper-dim hover:text-paper"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">{children}</main>
    </div>
  );
}

function InviteCode({ crew, code }: { crew: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(code).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="flex min-w-0 items-center gap-2 font-type text-sm"
      title="Copy the invite code"
    >
      <span className="truncate text-paper">{crew}</span>
      <span className="border-2 border-paper-dim/50 px-1.5 text-crystal">{copied ? "copied" : code}</span>
    </button>
  );
}
