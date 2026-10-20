"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

// the landing page's print vocabulary, trimmed down for forms and tables

export function Card({ children, className = "", tone = "paper" }: { children: ReactNode; className?: string; tone?: "paper" | "ink" }) {
  const t = tone === "paper" ? "bg-paper text-ink" : "bg-ink/85 text-paper backdrop-blur-sm";
  return <section className={`border-[3px] border-ink p-5 print-shadow sm:p-6 ${t} ${className}`}>{children}</section>;
}

export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-type text-xs uppercase tracking-[0.3em] text-brick ${className}`}>{children}</p>;
}

export function Title({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`mt-1 font-display text-2xl leading-tight sm:text-3xl ${className}`}>{children}</h2>;
}

const BUTTON = {
  crystal: "bg-crystal text-ink",
  paper: "bg-paper text-ink",
  danger: "bg-brick text-paper",
} as const;

export function Button({ tone = "crystal", className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof BUTTON }) {
  return (
    <button
      {...rest}
      className={`border-[3px] border-ink px-4 py-2.5 font-display text-sm uppercase tracking-wider print-shadow transition-transform hover:-translate-y-0.5 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 ${BUTTON[tone]} ${className}`}
    />
  );
}

export function Field({ label, hint, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="font-type text-xs uppercase tracking-[0.2em] text-ink/70">{label}</span>
      <input
        {...rest}
        className="mt-1 w-full border-[3px] border-ink bg-paper-dim/40 px-3 py-2.5 font-type text-ink outline-none placeholder:text-ink/40 focus:bg-paper focus:shadow-[3px_3px_0_var(--color-crystal)]"
      />
      {hint && <span className="mt-1 block font-type text-xs text-ink/60">{hint}</span>}
    </label>
  );
}

/** Walter / Jesse badge. */
export function CategoryBadge({ category }: { category: "walter" | "jesse" }) {
  return (
    <span
      className={`inline-block border-2 border-ink px-2 py-0.5 font-stencil text-[11px] font-bold uppercase tracking-[0.2em] ${
        category === "jesse" ? "bg-hazmat text-ink" : "bg-ink text-paper"
      }`}
    >
      {category === "jesse" ? "Jesse · student" : "Walter · open"}
    </span>
  );
}

export function Notice({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "ok" }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`mt-3 border-2 px-3 py-2 font-type text-sm ${tone === "error" ? "border-brick text-brick" : "border-olive text-olive"}`}>
      {children}
    </p>
  );
}

/** A stamped status mark (LOCKED IN, SHIPPED, ...). */
export function Stamp({ children, tone = "brick" }: { children: ReactNode; tone?: "brick" | "olive" }) {
  return (
    <span className={`inline-block -rotate-3 border-[3px] px-2 py-0.5 font-stencil text-sm font-bold uppercase tracking-[0.25em] ${tone === "brick" ? "border-brick text-brick" : "border-olive text-olive"}`}>
      {children}
    </span>
  );
}
