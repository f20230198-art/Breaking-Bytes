"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { passed, useLab } from "@/components/dashboard/LabProvider";
import { Button, Card, Kicker, Notice, Stamp, Title } from "@/components/dashboard/ui";
import { Countdown } from "@/components/ui/Countdown";
import { rpcMessage } from "@/lib/rpcErrors";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

type Problem = Tables<"problems">;

/**
 * The Formula. Chapter 1 has no company sponsors, so there is no supplier step: the problem statements unseal at the
 * drop (the database won't return them a second earlier), grouped by domain, and the leader locks one in.
 */
export function FormulaPage() {
  const { crew, cfg, offset, now } = useLab();
  const t = now();

  if (!crew)
    return (
      <Card className="max-w-xl">
        <Kicker>The formula</Kicker>
        <Title>Find a crew first.</Title>
        <p className="mt-2 font-type text-sm">Problems are picked per crew.</p>
        <Link href="/dashboard/crew" className="mt-4 inline-block font-display text-sm uppercase underline underline-offset-4">Go to Crew →</Link>
      </Card>
    );

  if (passed(cfg.problems_release_at, t)) return <Dossier />;
  return (
    <Card tone="ink" className="max-w-xl">
      <Kicker className="text-rust">The formula</Kicker>
      <Title>The dossier is still sealed.</Title>
      <p className="mt-2 font-type text-sm text-paper-dim">
        Every problem statement unseals at once, for every crew. Your leader then locks one in: one problem per crew, no switching after.
      </p>
      {cfg.problems_release_at
        ? <div className="mt-4"><Countdown to={cfg.problems_release_at} offsetMs={offset} label="Problems drop in" /></div>
        : <p className="mt-4 font-type text-sm text-paper-dim">The drop time will be announced.</p>}
    </Card>
  );
}

function Dossier() {
  const { crew, isLeader, reload } = useLab();
  // until the crew has a problem, check every 10 s (and on coming back to the tab), so when the leader locks one in,
  // everyone else in the crew sees it within seconds. A poll, not Realtime: the whole room sits on this page at the
  // drop, and the free plan caps live connections. It stops once the crew has a problem.
  const waiting = !!crew && !crew.problem_id;
  useEffect(() => {
    if (!waiting) return;
    const id = setInterval(() => void reload(), 10_000);
    const onShow = () => document.visibilityState === "visible" && void reload();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [waiting, reload]);
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [order, setOrder] = useState<string[]>([]);
  useEffect(() => {
    const db = supabaseBrowser();
    // RLS only returns published problems once the drop has passed
    void db.from("problems").select("*").order("id").then(({ data }) => setProblems(data ?? []));
    void db.from("domains").select("name").order("sort_order").then(({ data }) => setOrder((data ?? []).map((d) => d.name)));
  }, []);
  if (!crew) return null;
  const accepted = crew.registration_status === "accepted";

  // grouped by domain (the problem's track) in the Domains order from admin; anything else after, untracked under "Open"
  const rank = (d: string) => (order.indexOf(d) + 1 || order.length + 1);
  const domains = new Map<string, Problem[]>();
  const sorted = [...(problems ?? [])].sort((a, b) => rank(a.track?.trim() || "Open") - rank(b.track?.trim() || "Open"));
  for (const p of sorted) {
    const d = p.track?.trim() || "Open";
    domains.set(d, [...(domains.get(d) ?? []), p]);
  }
  const locked = problems?.find((p) => p.id === crew.problem_id);
  // once locked, the crew sees only its own problem
  const shown = [...domains].map(([d, list]) => [d, locked ? list.filter((p) => p.id === locked.id) : list] as const).filter(([, list]) => list.length);
  const lockedNote = crew.problem_locked_at
    ? ` Locked in${crew.problem_locked_by ? ` by ${crew.problem_locked_by}` : ""} at ${new Date(crew.problem_locked_at).toLocaleTimeString("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit" })}.`
    : "";

  const lock = async (id: string) => {
    if (!window.confirm("Lock this problem in? This can't be undone.")) return;
    setBusy(true); setError(null);
    const { error } = await supabaseBrowser().rpc("lock_problem", { p_problem: id });
    setBusy(false);
    if (error) setError(rpcMessage(error));
    else await reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <Kicker className="text-rust">The formula · unsealed</Kicker>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">The dossier is open.</h1>
        <p className="mt-2 max-w-xl font-type text-paper-dim">
          {locked ? `Your crew is cooking ${locked.id} · ${locked.title}.${lockedNote}`
            : !accepted ? "Read them all. Your crew hasn't been accepted yet, so it can't lock a problem in. Talk to an organiser."
            : isLeader ? "Read them all, then lock one in for your crew. One problem per crew, and it can't be changed."
            : "Read them all. Your leader locks one in for the crew."}
        </p>
        {!locked && domains.size > 1 && (
          <nav className="mt-3 flex flex-wrap gap-2" aria-label="Domains">
            {[...domains.keys()].map((d) => (
              <a key={d} href={`#domain-${slug(d)}`} className="border-2 border-paper/40 px-2 py-0.5 font-type text-xs uppercase tracking-wider hover:bg-paper hover:text-ink">{d}</a>
            ))}
          </nav>
        )}
      </div>
      {error && <div className="max-w-xl"><Notice>{error}</Notice></div>}
      {problems === null && <p className="font-type text-paper-dim">Opening the folder…</p>}
      {problems?.length === 0 && <p className="font-type text-paper-dim">No problems are published yet. Hold tight, and refresh in a minute.</p>}
      {shown.map(([domain, list]) => (
        <section key={domain} id={`domain-${slug(domain)}`} className="scroll-mt-24 space-y-4">
          <h2 className="font-display text-xl uppercase tracking-wider text-paper">{domain}</h2>
      {list.map((p) => {
        const mine = crew.problem_id === p.id;
        return (
          <Card key={p.id} className={mine ? "shadow-[6px_6px_0_var(--color-crystal)]" : ""}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Kicker>{p.id}{p.capacity ? ` · max ${p.capacity} crews` : ""}</Kicker>
                <Title>{p.title}</Title>
              </div>
              {mine ? <Stamp tone="olive">Locked in</Stamp> : <Stamp>Classified</Stamp>}
            </div>
            {p.summary && <p className="mt-3 font-type">{p.summary}</p>}
            {/* plain text on purpose: statements come from admins, but nothing is rendered as HTML */}
            {p.body_md && <div className="mt-4 whitespace-pre-wrap border-t-2 border-dashed border-ink/30 pt-4 font-type text-sm leading-relaxed">{p.body_md}</div>}
            {p.criteria_md && (
              <div className="mt-4">
                <p className="font-display text-sm uppercase">Judging criteria</p>
                <div className="mt-1 whitespace-pre-wrap font-type text-sm leading-relaxed">{p.criteria_md}</div>
              </div>
            )}
            {isLeader && accepted && !crew.problem_id && <Button className="mt-5" disabled={busy} onClick={() => lock(p.id)}>Lock this problem in</Button>}
          </Card>
        );
      })}
        </section>
      ))}
    </div>
  );
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
