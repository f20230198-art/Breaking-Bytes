"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, ErrorLine, H1, adminDb, gulf, inputCls } from "./AdminShell";

type Member = { id: string; name: string; email: string; category: string; leader: boolean };
type CrewRow = {
  id: string; name: string; invite_code: string; status: "active" | "disqualified"; roster_locked: boolean; category: string;
  sponsor: string | null; problem_id: string | null; members: Member[]; repo_url: string | null; live_url: string | null;
  video_url: string | null; notes: string | null; submitted_at: string | null; late: boolean;
};
type Opt = { id: string; name: string };

/** Every crew with roster and submission; fix-ups (rename, move, reassign, disqualify) and the CSV export. */
export function AdminCrews() {
  const [rows, setRows] = useState<CrewRow[] | null>(null);
  const [sponsors, setSponsors] = useState<Opt[]>([]);
  const [problems, setProblems] = useState<(Opt & { sponsor_id: string })[]>([]);
  const [q, setQ] = useState("");
  const [onlySubmitted, setOnlySubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const db = adminDb();
    const [c, s, p] = await Promise.all([
      db.rpc("admin_crews"),
      db.from("sponsors").select("id, name").eq("is_supplier", true).order("sort_order"),
      db.from("problems").select("id, title, sponsor_id").order("id"),
    ]);
    if (c.error) setError(c.error.message);
    setRows((c.data as CrewRow[]) ?? []);
    setSponsors((s.data as Opt[]) ?? []);
    setProblems(((p.data ?? []) as { id: string; title: string; sponsor_id: string }[]).map((x) => ({ id: x.id, name: `${x.id} · ${x.title}`, sponsor_id: x.sponsor_id })));
  }, []);
  useEffect(() => {
    void (async () => load())();
  }, [load]);

  const run = async (op: PromiseLike<{ error: { message: string } | null }>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    const { error } = await op;
    if (error) setError(error.message);
    void load();
  };
  const teams = () => adminDb().from("teams");

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows ?? []).filter((r) =>
      (!onlySubmitted || r.repo_url || r.live_url || r.video_url) &&
      (!s || r.name.toLowerCase().includes(s) || r.invite_code.toLowerCase().includes(s) || r.members.some((m) => `${m.name} ${m.email}`.toLowerCase().includes(s))));
  }, [rows, q, onlySubmitted]);

  const moveMember = async (m: Member) => {
    const code = window.prompt(`Move ${m.name} to which crew? Enter its invite code.`)?.trim().toUpperCase();
    if (!code) return;
    const { data } = await teams().select("id").eq("invite_code", code.startsWith("ABQ-") ? code : `ABQ-${code}`).maybeSingle();
    if (!data) return setError(`No crew with code ${code}.`);
    void run(adminDb().from("team_members").update({ team_id: data.id }).eq("user_id", m.id));
  };

  return (
    <div>
      <H1 sub="Rename, move people, reassign suppliers or problems, disqualify. Every change is in the audit log.">Crews</H1>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input className={`${inputCls} max-w-xs`} placeholder="Search crew, code, name, email" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlySubmitted} onChange={(e) => setOnlySubmitted(e.target.checked)} className="accent-crystal" /> Submitted only</label>
        <Btn onClick={() => exportCsv(shown)}>Export CSV ({shown.length})</Btn>
      </div>
      <ErrorLine text={error} />
      <div className="space-y-3">
        {shown.map((r) => (
          <details key={r.id} className={`rounded border ${r.status === "disqualified" ? "border-siren/40 opacity-70" : "border-paper/15"}`}>
            <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
              <span className="font-display text-base">{r.name}</span>
              <span className="text-crystal">{r.invite_code}</span>
              <span className="text-paper-dim">{r.members.length} cooks · {r.category}</span>
              <span className="text-paper-dim">{r.sponsor ?? "no supplier"} · {r.problem_id ?? "no problem"}</span>
              {r.status === "disqualified" && <span className="text-siren">disqualified</span>}
              {r.submitted_at && (r.repo_url || r.live_url || r.video_url) ? <span className={r.late ? "text-siren" : "text-crystal"}>submitted {gulf(r.submitted_at)}{r.late ? " (late)" : ""}</span> : null}
            </summary>
            <div className="grid gap-4 border-t border-paper/10 p-4 lg:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-paper-dim">Members</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {r.members.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center gap-2">
                      <span>{m.name || "—"}{m.leader ? " (leader)" : ""}</span>
                      <span className="text-paper-dim">{m.email} · {m.category}</span>
                      <Btn onClick={() => moveMember(m)}>Move</Btn>
                      <Btn tone="danger" onClick={() => run(adminDb().from("team_members").delete().eq("user_id", m.id), `Remove ${m.name} from ${r.name}?`)}>Remove</Btn>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs uppercase tracking-wider text-paper-dim">Submission</p>
                <ul className="mt-1 space-y-1 break-all text-sm">
                  {([["Repo", r.repo_url], ["Live", r.live_url], ["Video", r.video_url]] as const).map(([k, v]) => (
                    <li key={k}>{k}: {v ? <a href={v} target="_blank" rel="noopener noreferrer" className="text-crystal underline">{v}</a> : <span className="text-paper-dim">—</span>}</li>
                  ))}
                  {r.notes && <li className="whitespace-pre-wrap text-paper-dim">Notes: {r.notes}</li>}
                </ul>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Btn onClick={() => { const n = window.prompt("New crew name", r.name); if (n) void run(teams().update({ name: n.trim() }).eq("id", r.id)); }}>Rename</Btn>
                  <Btn onClick={() => run(teams().update({ roster_locked: !r.roster_locked }).eq("id", r.id))}>{r.roster_locked ? "Unlock roster" : "Lock roster"}</Btn>
                  <Btn tone={r.status === "active" ? "danger" : "primary"}
                    onClick={() => run(teams().update({ status: r.status === "active" ? "disqualified" : "active" }).eq("id", r.id), r.status === "active" ? `Disqualify ${r.name}?` : undefined)}>
                    {r.status === "active" ? "Disqualify" : "Reinstate"}
                  </Btn>
                  <Btn tone="danger" onClick={() => run(teams().delete().eq("id", r.id), `Delete ${r.name} and its submission? Members become crewless.`)}>Delete crew</Btn>
                </div>
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-paper-dim">Supplier</span>
                  <select className={`${inputCls} mt-1`} value={sponsors.find((s) => s.name === r.sponsor)?.id ?? ""}
                    onChange={(e) => run(teams().update({ sponsor_id: e.target.value || null, problem_id: null }).eq("id", r.id))}>
                    <option value="">—</option>
                    {sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-paper-dim">Problem</span>
                  <select className={`${inputCls} mt-1`} value={r.problem_id ?? ""} onChange={(e) => run(teams().update({ problem_id: e.target.value || null }).eq("id", r.id))}>
                    <option value="">—</option>
                    {problems.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </details>
        ))}
        {rows && !shown.length && <p className="text-sm text-paper-dim">No crews match.</p>}
      </div>
    </div>
  );
}

function exportCsv(rows: CrewRow[]) {
  const head = ["crew", "invite_code", "status", "category", "supplier", "problem", "members", "emails", "repo", "live", "video", "notes", "submitted_at_utc", "late"];
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    // quote everything; neutralise leading = + - @ so a spreadsheet never runs a submitted value as a formula
    return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
  };
  const lines = rows.map((r) => [
    r.name, r.invite_code, r.status, r.category, r.sponsor, r.problem_id,
    r.members.map((m) => m.name).join("; "), r.members.map((m) => m.email).join("; "),
    r.repo_url, r.live_url, r.video_url, r.notes, r.submitted_at, r.late,
  ].map(cell).join(","));
  const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `breaking-bytes-crews-${new Date().toISOString().slice(0, 16).replace(":", "")}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
