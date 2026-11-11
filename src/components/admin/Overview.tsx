"use client";

import { useEffect, useState } from "react";
import { H1, adminDb } from "./AdminShell";

type Stats = { users: number; banned: number; crews: number; disqualified: number; solo: number; jesse_crews: number; submitted: number; suppliers: { name: string; taken: number; cap: number }[] };

export function AdminOverview() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // which problem each accepted crew locked in (Chapter 1 has no suppliers, so this replaces the supplier fill)
  const [picks, setPicks] = useState<{ id: string; title: string; crews: number; cap: number | null }[]>([]);
  useEffect(() => {
    const get = () => {
      void adminDb().rpc("admin_overview").then(({ data, error }) => (error ? setErr(error.message) : setS(data as Stats)));
      void Promise.all([
        adminDb().from("problems").select("id, title, capacity").eq("is_published", true).order("id"),
        adminDb().from("teams").select("problem_id").eq("status", "active").eq("registration_status", "accepted").not("problem_id", "is", null),
      ]).then(([p, t]) => {
        const n = new Map<string, number>();
        for (const r of t.data ?? []) n.set(r.problem_id!, (n.get(r.problem_id!) ?? 0) + 1);
        setPicks((p.data ?? []).map((x) => ({ id: x.id, title: x.title, crews: n.get(x.id) ?? 0, cap: x.capacity })));
      });
    };
    get();
    const id = setInterval(get, 20000);
    return () => clearInterval(id);
  }, []);
  if (err) return <p className="text-siren">{err}</p>;
  if (!s) return <p className="text-paper-dim">Loading…</p>;
  const tiles = [
    ["Users", s.users], ["Crews", s.crews], ["Solo (no crew)", s.solo],
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
      <h2 className="mt-8 font-display text-lg">Problem picks</h2>
      {!picks.length && <p className="mt-2 text-sm text-paper-dim">No published problems yet.</p>}
      <ul className="mt-3 space-y-2">
        {picks.map((x) => (
          <li key={x.id} className="grid grid-cols-[1fr_5rem] items-center gap-3 text-sm sm:grid-cols-[minmax(0,20rem)_1fr_5rem]">
            <span className="truncate">{x.id} · {x.title}</span>
            <span className="hidden h-2 rounded bg-paper/10 sm:block"><span className="block h-full rounded bg-crystal" style={{ width: `${Math.min(100, (x.crews / Math.max(1, x.cap ?? Math.max(...picks.map((y) => y.crews), 1))) * 100)}%` }} /></span>
            <span className="text-right tabular-nums text-paper-dim">{x.crews}{x.cap ? ` / ${x.cap}` : ""} crews</span>
          </li>
        ))}
      </ul>
      {s.suppliers.length > 0 && <h2 className="mt-8 font-display text-lg">Supplier fill</h2>}
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
