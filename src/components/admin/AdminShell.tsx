"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const NAV = [
  ["/admin", "Overview"],
  ["/admin/event", "Event"],
  ["/admin/crews", "Crews"],
  ["/admin/users", "Users"],
  ["/admin/sponsors", "Sponsors"],
  ["/admin/problems", "Problems"],
  ["/admin/prizes", "Prizes"],
  ["/admin/content", "Content"],
  ["/admin/universities", "Universities"],
  ["/admin/audit", "Audit log"],
] as const;

/**
 * The admin frame: plain black, plain text, built for speed. The gate here is cosmetic: every admin read and write
 * is checked by the database (RLS is_admin(), role granted only from admin_emails) and recorded in admin_audit.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    const supabase = supabaseBrowser();
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return setState("denied");
      const { data: me } = await supabase.from("profiles").select("role, banned").eq("id", data.user.id).single();
      setState(me?.role === "admin" && !me.banned ? "ok" : "denied");
    });
  }, []);

  if (state !== "ok")
    return (
      <main className="grid min-h-svh place-items-center bg-ink font-sans text-paper">
        <p className="text-sm text-paper-dim">{state === "checking" ? "Checking clearance…" : "Admins only. This attempt was not logged, but every admin action is."}</p>
      </main>
    );

  return (
    <div className="min-h-svh bg-ink font-sans text-paper md:grid md:grid-cols-[13rem_1fr]">
      <aside className="border-b border-paper/15 p-4 md:min-h-svh md:border-b-0 md:border-r">
        <Link href="/" className="font-display">Gus&apos;s Office</Link>
        <nav className="mt-4 flex gap-1 overflow-x-auto md:flex-col" aria-label="Admin">
          {NAV.map(([href, label]) => {
            const on = href === "/admin" ? path === href : path.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={on ? "page" : undefined}
                className={`shrink-0 rounded px-2 py-1.5 text-sm ${on ? "bg-paper text-ink" : "text-paper-dim hover:bg-paper/10 hover:text-paper"}`}>
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}

/** Admin pages write many different tables; this is the untyped client for that (the database still checks it all). */
export const adminDb = () => supabaseBrowser() as unknown as SupabaseClient;

// Gulf time (UTC+4, no daylight saving) ⇄ the value of an <input type="datetime-local">
const GST = 4 * 3600_000;
export const toGulfInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + GST).toISOString().slice(0, 16) : "");
export const fromGulfInput = (v: string) => (v ? new Date(new Date(`${v}:00Z`).getTime() - GST).toISOString() : null);
export const gulf = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export function H1({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl">{children}</h1>
      {sub && <p className="mt-1 text-sm text-paper-dim">{sub}</p>}
    </div>
  );
}

export function Btn({ tone = "plain", className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "plain" | "primary" | "danger" }) {
  const t = tone === "primary" ? "bg-crystal text-ink hover:bg-paper" : tone === "danger" ? "border border-siren/60 text-siren hover:bg-siren/10" : "border border-paper/25 hover:bg-paper/10";
  return <button {...rest} className={`rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${t} ${className}`} />;
}

export const inputCls = "w-full rounded border border-paper/25 bg-ink-soft px-2 py-1.5 text-sm text-paper outline-none focus:border-crystal";

export function ErrorLine({ text }: { text: string | null }) {
  return text ? <p role="alert" className="mt-2 text-sm text-siren">{text}</p> : null;
}
