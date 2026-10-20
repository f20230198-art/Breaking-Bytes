"use client";

import { useEffect, useState } from "react";
import { H1, adminDb } from "./AdminShell";

type Stats = { users: number; banned: number; crews: number; disqualified: number; solo: number; jesse_crews: number; submitted: number; suppliers: { name: string; taken: number; cap: number }[] };

export function AdminOverview() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    const get = () => void adminDb().rpc("admin_overview").then(({ data, error }) => (error ? setErr(error.message) : setS(data as Stats)));
    get();
    const id = setInterval(get, 20000);
    return () => clearInterval(id);
  }, []);
  if (err) return <p className="text-siren">{err}</p>;
  if (!s) return <p className="text-paper-dim">Loading…</p>;
  const tiles = [
    ["Users", s.users], ["Crews", s.crews], ["Solo (no crew)", s.solo], ["Jesse crews", s.jesse_crews],
    ["Submitted", `${s.submitted} / ${s.crews}`], ["Disqualified", s.disqualified], ["Banned", s.banned],
  ] as const;
  return (
    <div>
      <H1 sub="Refreshes every 20 seconds.">Overview</H1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(([k, v]) => (
          <div key={k} className="rounded border border-paper/15 p-4">
            <p className="text-xs uppercase tracking-wider text-paper-dim">{k}</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-8 font-display text-lg">Supplier fill</h2>
      <ul className="mt-3 space-y-2">
        {s.suppliers.map((x) => (
          <li key={x.name} className="grid grid-cols-[8rem_1fr_5rem] items-center gap-3 text-sm">
            <span>{x.name}</span>
            <span className="h-2 rounded bg-paper/10"><span className="block h-full rounded bg-crystal" style={{ width: `${Math.min(100, (x.taken / Math.max(1, x.cap)) * 100)}%` }} /></span>
            <span className="text-right tabular-nums text-paper-dim">{x.taken} / {x.cap}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
