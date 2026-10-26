"use client";
/* eslint-disable @next/next/no-img-element -- Google avatars, tiny */

import { useEffect, useState, type FormEvent } from "react";
import { useLab, type Crew, type Member } from "@/components/dashboard/LabProvider";
import { Button, Card, CategoryBadge, Field, Kicker, Notice, Stamp, Title } from "@/components/dashboard/ui";
import { rpcMessage } from "@/lib/rpcErrors";
import { supabaseBrowser } from "@/lib/supabase/client";

/** The Crew: start one or join with a code; then the roster, live, with the leader's controls. */
export function CrewPage() {
  const { crew } = useLab();
  return crew ? <Roster crew={crew} /> : <NoCrew />;
}

function NoCrew() {
  const { cfg, reload } = useLab();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("create"); setError(null);
    const { error } = await supabaseBrowser().rpc("create_team", { p_name: name });
    setBusy(null);
    if (error) setError(rpcMessage(error));
    else await reload();
  };
  const join = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("join"); setError(null);
    const { data, error } = await supabaseBrowser().rpc("join_team", { p_code: code });
    setBusy(null);
    if (error) setError(rpcMessage(error));
    else if (!data) setError("No crew has that code. Check it with your leader.");
    else await reload();
  };

  return (
    <div>
      <Kicker className="text-rust">The crew</Kicker>
      <h1 className="mt-1 font-display text-3xl sm:text-4xl">Every cook needs a crew.</h1>
      <p className="mt-2 max-w-xl font-type text-paper-dim">
        Up to {cfg.team_max} people, and going solo is fine. Start a crew and share the code, or join with a code from your leader.
      </p>
      {error && <div className="max-w-xl"><Notice>{error}</Notice></div>}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <Kicker>Start a crew</Kicker>
          <form onSubmit={create} className="mt-4 space-y-4">
            <Field label="Crew name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required placeholder="Blue Sky" />
            <Button type="submit" disabled={busy !== null || name.trim().length < 3}>{busy === "create" ? "Cooking…" : "Start the crew"}</Button>
          </form>
        </Card>
        <Card>
          <Kicker>Join a crew</Kicker>
          <form onSubmit={join} className="mt-4 space-y-4">
            <Field label="Invite code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={9} required placeholder="ABQ-7K2Q9" autoCapitalize="characters" spellCheck={false} />
            <Button type="submit" tone="paper" disabled={busy !== null || code.trim().length < 5}>{busy === "join" ? "Knocking…" : "Join"}</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Roster({ crew }: { crew: Crew }) {
  const { me, cfg, isLeader, reload } = useLab();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // live roster: only this page holds a Realtime connection, and only while it's open
  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`crew-${crew.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members", filter: `team_id=eq.${crew.id}` }, () => void reload())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "teams", filter: `id=eq.${crew.id}` }, () => void reload())
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [crew.id, reload]);

  const act = async (fn: () => PromiseLike<{ error: { message?: string } | null }>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true); setError(null);
    const { error } = await fn();
    setBusy(false);
    if (error) setError(rpcMessage(error));
    else await reload();
  };
  const sb = supabaseBrowser();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Kicker>Your crew</Kicker>
            <Title>{crew.name}</Title>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {cfg.portal_open ? <CategoryBadge category={crew.category} /> : <Stamp tone={crew.registration_status === "accepted" ? "olive" : "brick"}>{STATUS[crew.registration_status].stamp}</Stamp>}
              {crew.roster_locked && <Stamp>Roster locked</Stamp>}
            </div>
            <p className="mt-3 max-w-md font-type text-sm text-ink/70">
              {!cfg.portal_open
                ? STATUS[crew.registration_status].text
                : crew.category === "jesse"
                  ? "Every member is a verified student, so this crew also competes for the student prizes."
                  : "Student prizes need every member to be a verified student. One Walter makes the whole crew Walter."}
            </p>
          </div>
          <div className="text-right">
            <p className="font-type text-xs uppercase tracking-[0.2em] text-ink/60">Invite code</p>
            <p className="font-display text-2xl tracking-wider">{crew.invite_code}</p>
            <p className="font-type text-xs text-ink/60">{crew.members.length} / {cfg.team_max} cooks</p>
          </div>
        </div>
        {error && <Notice>{error}</Notice>}
      </Card>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {crew.members.map((m, i) => (
          <Polaroid key={m.id} m={m} tilt={i % 2 ? 1.5 : -1.5} showCategory={cfg.portal_open} canRemove={isLeader && m.id !== me.id} busy={busy}
            onRemove={() => act(() => sb.rpc("remove_member", { p_user: m.id }), `Remove ${m.display_name} from the crew?`)} />
        ))}
        {Array.from({ length: Math.max(0, cfg.team_max - crew.members.length) }, (_, i) => (
          <li key={`empty-${i}`} className="grid aspect-[4/5] place-items-center border-[3px] border-dashed border-paper-dim/40 font-type text-sm text-paper-dim">
            Empty seat
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        {isLeader && (
          <Button tone="paper" disabled={busy} onClick={() => act(() => sb.rpc("set_roster_locked", { p_locked: !crew.roster_locked }))}>
            {crew.roster_locked ? "Unlock roster" : "Lock roster"}
          </Button>
        )}
        <Button tone="danger" disabled={busy}
          onClick={() => act(() => sb.rpc("leave_team"), isLeader && crew.members.length > 1 ? "Leave the crew? Leadership passes to the longest-standing member." : "Leave the crew?")}>
          Leave crew
        </Button>
      </div>
    </div>
  );
}

// pre-registration: seats are limited, so the organisers review every crew
const STATUS = {
  pending: { stamp: "Under review", text: "You're registered. Seats are limited, so the organisers review every crew; this page updates when they decide. Teammates can still join with the code." },
  accepted: { stamp: "Accepted", text: "You're in. See you at the lab. Need to change who's in the crew? Talk to an organiser." },
  waitlisted: { stamp: "Waitlist", text: "The hall is full for now, so your crew is on the waitlist. We'll move you up if a seat opens." },
} as const;

function Polaroid({ m, tilt, showCategory, canRemove, busy, onRemove }: { m: Member; tilt: number; showCategory: boolean; canRemove: boolean; busy: boolean; onRemove: () => void }) {
  return (
    <li className="relative border-[3px] border-ink bg-paper p-3 pb-4 text-ink print-shadow" style={{ rotate: `${tilt}deg` }}>
      {/* a strip of tape holding it up */}
      <span aria-hidden className="absolute -top-3 left-1/2 h-5 w-16 -translate-x-1/2 rotate-2 bg-paper-dim/80" />
      <div className="grid aspect-square place-items-center overflow-hidden border-2 border-ink bg-ink-soft">
        {m.avatar_url ? (
          <img src={m.avatar_url} alt="" referrerPolicy="no-referrer" className="size-full object-cover grayscale" />
        ) : (
          <span className="font-display text-5xl text-paper">{m.display_name.slice(0, 1).toUpperCase() || "?"}</span>
        )}
      </div>
      <p className="mt-3 truncate font-display">{m.display_name || "Unnamed cook"}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        {showCategory && <CategoryBadge category={m.category} />}
        {m.is_leader && <span className="font-stencil text-xs font-bold uppercase tracking-widest text-brick">Leader</span>}
      </div>
      {canRemove && (
        <button type="button" disabled={busy} onClick={onRemove} className="mt-3 font-type text-xs text-brick underline underline-offset-2 disabled:opacity-50">
          Remove
        </button>
      )}
    </li>
  );
}
