import Link from "next/link";
import type { ReactNode } from "react";

/** Primary CTA: a carved ink block with a crystal-blue edge, pressed like a stamp. */
export function StampButton({ href, children, tone = "crystal" }: { href: string; children: ReactNode; tone?: "crystal" | "paper" }) {
  const colors = tone === "crystal" ? "bg-crystal text-ink" : "bg-paper text-ink";
  return (
    <Link
      href={href}
      className={`carved group inline-flex items-center gap-3 border-[3px] border-ink px-6 py-3 font-display text-lg uppercase tracking-wide ${colors} print-shadow transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crystal`}
    >
      {children}
      <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
    </Link>
  );
}
