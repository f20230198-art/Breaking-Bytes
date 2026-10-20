"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { passed, useLab } from "@/components/dashboard/LabProvider";
import { Button, Card, Kicker, Notice, Stamp, Title } from "@/components/dashboard/ui";
import { Countdown } from "@/components/ui/Countdown";
import { rpcMessage } from "@/lib/rpcErrors";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

type Slot = { sponsor_id: string; name: string; symbol: string | null; logo_path: string | null; taken: number; cap: number };
type Problem = Tables<"problems">;

/**
 * The Formula. 10:00–12:00 the leader picks a supplier (capped so crews spread evenly); at 12:00 the problem
 * statements unseal (the database won't return them a second earlier) and the leader locks one in.
 */
export function FormulaPage() {
  const { crew, cfg, offset, now } = useLab();
  const t = now();

  if (!crew)
    return (
      <Card className="max-w-xl">
        <Kicker>The formula</Kicker>
        <Title>Find a crew first.</Title>
        <p className="mt-2 font-type text-sm">Suppliers and problems are picked per crew.</p>
        <Link href="/dashboard/crew" className="mt-4 inline-block font-display text-sm uppercase underline underline-offset-4">Go to Crew →</Link>
      </Card>
    );

  if (passed(cfg.problems_release_at, t)) return <Dossier />;
  if (!passed(cfg.supplier_pick_at, t))
    return (
      <Card tone="ink" className="max-w-xl">
        <Kicker className="text-rust">The formula</Kicker>
        <Title>Suppliers aren&apos;t taking crews yet.</Title>
        {cfg.supplier_pick_at && <div className="mt-4"><Countdown to={cfg.supplier_pick_at} offsetMs={offset} label="Suppliers open in" /></div>}
      </Card>
    );
  return <Suppliers />;
}

function Suppliers() {
  const { crew, cfg, isLeader, offset, reload } = useLab();
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchSlots = useCallback(async () => {
    const { data } = await supabaseBrowser().rpc("supplier_slots");
    setSlots((data as Slot[]) ?? []);
  }, []);
  useEffect(() => {
    void (async () => fetchSlots())();
    const id = setInterval(() => void fetchSlots(), 15000); // slots fill up as other crews pick; a poll is plenty
    return () => clearInterval(id);
  }, [fetchSlots]);

  const pick = async (id: string) => {
    setBusy(true); setError(null);
    const { error } = await supabaseBrowser().rpc("pick_supplier", { p_sponsor: id });
    setBusy(false);
    if (error) setError(rpcMessage(error));
    await Promise.all([reload(), fetchSlots()]);
  };

  return (
    <div>
      <Kicker className="text-rust">The formula · step 1</Kicker>
      <h1 className="mt-1 font-display text-3xl sm:text-4xl">Pick your supplier.</h1>
      <p className="mt-2 max-w-xl font-type text-paper-dim">
        Each company sets the problem your crew will cook. Slots are capped so crews spread out evenly.
        {isLeader ? " You can switch until the drop." : " Only your leader can pick."}
      </p>
      {cfg.problems_release_at && (
        <p className="mt-2 font-type text-sm text-paper-dim">
          Problems drop in <Countdown to={cfg.problems_release_at} offsetMs={offset} compact label="Problems drop in" />
        </p>
      )}
      {error && <div className="max-w-xl"><Notice>{error}</Notice></div>}
      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(slots ?? []).map((s) => {
          const mine = crew?.sponsor_id === s.sponsor_id;
          const full = s.taken >= s.cap && !mine;
          return (
            <li key={s.sponsor_id}>
              <Card className={`h-full ${mine ? "shadow-[6px_6px_0_var(--color-crystal)]" : ""} ${full ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between">
                  <span className="font-display text-5xl leading-none">{s.symbol ?? s.name.slice(0, 2)}</span>
                  {mine && <Stamp tone="olive">Yours</Stamp>}
                  {full && <Stamp>Full</Stamp>}
                </div>
                <p className="mt-2 font-type uppercase tracking-wider">{s.name}</p>
                <div className="mt-4 h-2 border-2 border-ink" aria-hidden>
                  <div className="h-full bg-brick" style={{ width: `${Math.min(100, (s.taken / Math.max(1, s.cap)) * 100)}%` }} />
                </div>
                <p className="mt-1 font-type text-xs text-ink/70">{Math.max(0, s.cap - s.taken)} of {s.cap} slots left</p>
                {isLeader && !mine && (
                  <Button className="mt-4" disabled={busy || full} onClick={() => pick(s.sponsor_id)}>Pick {s.name}</Button>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
      {slots?.length === 0 && <p className="mt-6 font-type text-paper-dim">No suppliers are listed yet.</p>}
    </div>
  );
}

function Dossier() {
  const { crew, isLeader, reload } = useLab();
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!crew?.sponsor_id) return;
    void supabaseBrowser().from("problems").select("*").eq("sponsor_id", crew.sponsor_id).order("id")
      .then(({ data }) => setProblems(data ?? []));
  }, [crew?.sponsor_id]);

  if (!crew?.sponsor_id)
    return (
      <Card className="max-w-xl">
        <Kicker>The formula</Kicker>
        <Title>Your crew didn&apos;t pick a supplier.</Title>
        <p className="mt-2 font-type text-sm">Find an organiser: they can assign one to your crew.</p>
      </Card>
    );

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
      </div>
      {error && <div className="max-w-xl"><Notice>{error}</Notice></div>}
      {problems === null && <p className="font-type text-paper-dim">Opening the folder…</p>}
      {problems?.length === 0 && <p className="font-type text-paper-dim">Your supplier hasn&apos;t published a problem yet. Hold tight.</p>}
      {problems?.map((p) => {
        const mine = crew.problem_id === p.id;
        return (
          <Card key={p.id} className={mine ? "shadow-[6px_6px_0_var(--color-crystal)]" : ""}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Kicker>{p.id} · {p.track ?? "Open track"}</Kicker>
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
            {isLeader && !crew.problem_id && <Button className="mt-5" disabled={busy} onClick={() => lock(p.id)}>Lock this problem in</Button>}
          </Card>
        );
      })}
    </div>
  );
}
