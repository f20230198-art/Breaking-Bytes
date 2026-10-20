"use client";

import { useEffect, useState, type FormEvent } from "react";
import { passed, useLab } from "@/components/dashboard/LabProvider";
import { Button, Card, Field, Kicker, Notice, Stamp, Title } from "@/components/dashboard/ui";
import { Countdown } from "@/components/ui/Countdown";
import { rpcMessage } from "@/lib/rpcErrors";
import { supabaseBrowser } from "@/lib/supabase/client";

const HTTPS = /^https:\/\/\S+$/;
const FIELDS = [
  ["repo", "GitHub repo", "https://github.com/your-crew/your-cook"],
  ["live", "Live link", "https://your-cook.vercel.app"],
  ["video", "Demo video", "https://youtu.be/..."],
] as const;
type Links = Record<(typeof FIELDS)[number][0], string>;

/** The Dead Drop: three links plus notes. Editable until the deadline, and the server is the one that says no. */
export function DeadDrop() {
  const { crew, cfg, offset, now } = useLab();
  const [links, setLinks] = useState<Links>({ repo: "", live: "", video: "" });
  const [notes, setNotes] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (!crew) return;
    void supabaseBrowser().from("submissions").select("*").eq("team_id", crew.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setLinks({ repo: data.repo_url ?? "", live: data.live_url ?? "", video: data.video_url ?? "" });
      setNotes(data.notes);
      if (data.repo_url || data.live_url || data.video_url) setSavedAt(data.updated_at);
    });
  }, [crew]);

  const t = now();
  const open = passed(cfg.submissions_open_at, t) && !passed(cfg.deadline_at, t);
  const valid = FIELDS.filter(([k]) => HTTPS.test(links[k].trim())).length;
  const purity = [0, 33, 66, 99.1][valid];

  if (!crew)
    return (
      <Card className="max-w-xl">
        <Kicker>The dead drop</Kicker>
        <Title>Find a crew first.</Title>
      </Card>
    );

  const ship = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const { data, error } = await supabaseBrowser().rpc("upsert_submission", {
      p_repo: links.repo, p_live: links.live, p_video: links.video, p_notes: notes,
    });
    setBusy(false);
    if (error) return setError(rpcMessage(error));
    setSavedAt(data as string);
    setBurst((n) => n + 1);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <Card>
        <Kicker>The dead drop</Kicker>
        <Title>Ship the batch.</Title>
        {!passed(cfg.submissions_open_at, t) && cfg.submissions_open_at && (
          <p className="mt-2 font-type text-sm">
            The Dead Drop opens in <Countdown to={cfg.submissions_open_at} offsetMs={offset} compact label="Dead Drop opens in" />. You can draft below meanwhile.
          </p>
        )}
        {passed(cfg.deadline_at, t) && <div className="mt-3"><Stamp>Closed. The cook is over.</Stamp></div>}
        <form onSubmit={ship} className="mt-5 space-y-4">
          {FIELDS.map(([k, label, ph]) => (
            <Field key={k} label={label} type="url" inputMode="url" placeholder={ph} value={links[k]} maxLength={300}
              disabled={passed(cfg.deadline_at, t)}
              onChange={(e) => setLinks((l) => ({ ...l, [k]: e.target.value }))}
              hint={links[k] && !HTTPS.test(links[k].trim()) ? "Must start with https://" : undefined} />
          ))}
          <label className="block">
            <span className="font-type text-xs uppercase tracking-[0.2em] text-ink/70">Notes for the judges</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={4} disabled={passed(cfg.deadline_at, t)}
              className="mt-1 w-full border-[3px] border-ink bg-paper-dim/40 px-3 py-2.5 font-type text-ink outline-none focus:bg-paper focus:shadow-[3px_3px_0_var(--color-crystal)]" />
          </label>
          {error && <Notice>{error}</Notice>}
          <Button type="submit" disabled={busy || !open || valid === 0}>{busy ? "Shipping…" : savedAt ? "Update the batch" : "Ship the batch"}</Button>
          {savedAt && (
            <p className="font-type text-xs text-ink/60">
              Last shipped {new Date(savedAt).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Dubai" })}. Re-ship as often as you like until the deadline.
            </p>
          )}
        </form>
      </Card>

      <Card tone="ink" className="relative overflow-hidden">
        <Kicker className="text-rust">Purity</Kicker>
        <p className="mt-2 font-display text-6xl tabular-nums text-crystal">{purity}%</p>
        <div className="mt-4 h-4 border-2 border-paper" aria-hidden>
          <div className="h-full bg-crystal transition-[width] duration-700" style={{ width: `${purity === 99.1 ? 100 : purity}%` }} />
        </div>
        <p className="mt-3 font-type text-sm text-paper-dim">Each valid link adds a third. All three: 99.1%.</p>
        {savedAt && valid === 3 && <div className="mt-5"><Stamp tone="olive">Verified · 99.1% pure</Stamp></div>}
        {burst > 0 && <Crystals key={burst} />}
      </Card>
    </div>
  );
}

/** A one-off shower of blue crystal shards (CSS only, gone after a couple of seconds). */
function Crystals() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: 26 }, (_, i) => (
        <span
          key={i}
          className="crystal-shard absolute top-0 bg-crystal"
          style={{
            left: `${(i * 37) % 100}%`,
            width: `${6 + (i % 4) * 3}px`,
            height: `${10 + (i % 5) * 4}px`,
            animationDelay: `${(i % 9) * 0.06}s`,
            ["--spin" as string]: `${(i % 2 ? 1 : -1) * (180 + i * 23)}deg`,
            ["--drift" as string]: `${((i * 13) % 40) - 20}px`,
          }}
        />
      ))}
    </div>
  );
}
