"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Tables } from "@/types/database";
import { Btn, ErrorLine, H1, adminDb, fromGulfInput, gulf, inputCls, toGulfInput } from "./AdminShell";

type Cfg = Tables<"event_config">;
const TIMES: [keyof Cfg, string][] = [
  ["starts_at", "The cook starts"],
  ["supplier_pick_at", "Supplier pick opens"],
  ["problems_release_at", "Problems drop"],
  ["roster_lock_at", "Rosters freeze"],
  ["submissions_open_at", "Dead Drop opens"],
  ["deadline_at", "Deadline (submissions lock)"],
];

/** The event clock. All times are entered in Gulf time; the database stores UTC and enforces every one of them. */
export function AdminEvent() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const load = () => void adminDb().from("event_config").select("*").eq("id", 1).single().then(({ data }) => setCfg(data as Cfg));
  useEffect(load, []);

  const patch = async (p: Partial<Cfg>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null); setSaved(false);
    const { error } = await adminDb().from("event_config").update(p).eq("id", 1);
    if (error) return setError(error.message);
    setSaved(true);
    load();
  };
  if (!cfg) return <p className="text-paper-dim">Loading…</p>;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    // everything editable on this form (id and updated_at are the database's)
    void patch({
      registration_open: cfg.registration_open, starts_at: cfg.starts_at, supplier_pick_at: cfg.supplier_pick_at,
      problems_release_at: cfg.problems_release_at, roster_lock_at: cfg.roster_lock_at, submissions_open_at: cfg.submissions_open_at,
      deadline_at: cfg.deadline_at, team_max: cfg.team_max, supplier_cap_slack: cfg.supplier_cap_slack, prize_pool_aed: cfg.prize_pool_aed,
      seat_cap: cfg.seat_cap,
    });
  };
  const now = new Date().toISOString();
  const plus = (iso: string | null, min: number) => new Date((iso ? new Date(iso).getTime() : Date.now()) + min * 60000).toISOString();

  return (
    <div className="max-w-2xl">
      <H1 sub="Times in Gulf time (UTC+4). The server clock enforces all of them; the countdowns everyone sees follow these.">Event</H1>
      <div className="mb-6 flex flex-wrap gap-2">
        <Btn tone={cfg.registration_open ? "danger" : "primary"} onClick={() => patch({ registration_open: !cfg.registration_open }, cfg.registration_open ? "Close registration? Nobody can start or join a crew." : undefined)}>
          {cfg.registration_open ? "Close registration" : "Open registration"}
        </Btn>
        <Btn tone={cfg.portal_open ? "danger" : "primary"}
          onClick={() => patch({ portal_open: !cfg.portal_open }, cfg.portal_open
            ? "Back to pre-registration? Hackers only see Crew and Profile."
            : "Open the full portal? Hackers see the Overview, Formula, Dead Drop and countdowns.")}>
          {cfg.portal_open ? "Back to pre-registration" : "Open the full portal"}
        </Btn>
        <Btn onClick={() => patch({ problems_release_at: now }, "Release the problem statements to every crew right now?")}>Release problems now</Btn>
        <Btn onClick={() => patch({ deadline_at: plus(cfg.deadline_at, 15) }, "Push the deadline back 15 minutes?")}>Deadline +15 min</Btn>
        <Btn onClick={() => patch({ deadline_at: plus(cfg.deadline_at, 60) }, "Push the deadline back an hour?")}>Deadline +1 h</Btn>
      </div>
      <form onSubmit={submit} className="grid gap-4 rounded border border-paper/15 p-4 sm:grid-cols-2">
        {TIMES.map(([k, label]) => (
          <label key={k} className="text-sm">
            <span className="text-xs uppercase tracking-wider text-paper-dim">{label}</span>
            <input type="datetime-local" className={`${inputCls} mt-1`} value={toGulfInput(cfg[k] as string | null)}
              onChange={(e) => setCfg({ ...cfg, [k]: fromGulfInput(e.target.value) })} />
            <span className="mt-0.5 block text-xs text-paper-dim">{gulf(cfg[k] as string | null)}</span>
          </label>
        ))}
        {([["team_max", "Max crew size"], ["seat_cap", "Seats in the hall (people)"], ["supplier_cap_slack", "Supplier cap slack (+ crews)"], ["prize_pool_aed", "Prize pool (AED)"]] as const).map(([k, label]) => (
          <label key={k} className="text-sm">
            <span className="text-xs uppercase tracking-wider text-paper-dim">{label}</span>
            <input type="number" className={`${inputCls} mt-1`} value={cfg[k] ?? ""} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value === "" ? null : Number(e.target.value) })} />
          </label>
        ))}
        <div className="sm:col-span-2">
          <Btn tone="primary">Save</Btn>
          {saved && <span className="ml-3 text-sm text-crystal">Saved.</span>}
          <ErrorLine text={error} />
        </div>
      </form>
    </div>
  );
}
