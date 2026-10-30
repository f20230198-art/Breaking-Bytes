"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;
export type EventConfig = Tables<"event_config">;
export type Member = { id: string; display_name: string; avatar_url: string | null; category: "walter" | "jesse"; is_leader: boolean; joined_at: string };
export type Crew = {
  id: string; name: string; invite_code: string; leader_id: string | null; roster_locked: boolean;
  sponsor_id: string | null; problem_id: string | null; status: "active" | "disqualified";
  registration_status: "pending" | "accepted" | "waitlisted";
  category: "walter" | "jesse"; members: Member[];
};

type Lab = {
  me: Profile;
  crew: Crew | null;
  cfg: EventConfig;
  /** server clock minus device clock, ms: every countdown and time check in the UI uses it */
  offset: number;
  now: () => number;
  isLeader: boolean;
  reload: () => Promise<void>;
};

const LabContext = createContext<Lab | null>(null);

export function useLab() {
  const lab = useContext(LabContext);
  if (!lab) throw new Error("useLab outside LabProvider");
  return lab;
}

/**
 * Loads the signed-in hacker's profile, crew and the event clock once for the whole dashboard, and measures the
 * offset to the server clock. Everything here is display state: the RPCs re-check every rule on the server.
 */
export function LabProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<{ me: Profile; crew: Crew | null; cfg: EventConfig; offset: number } | null>(null);
  const [failed, setFailed] = useState(false);
  // re-render when the next event time passes, so phase changes (problems dropping, the deadline passing) show up on
  // their own; the countdowns tick by themselves, nothing else needs a re-render in between
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!state) return;
    const now = Date.now() + state.offset;
    const c = state.cfg;
    const due = [c.starts_at, c.supplier_pick_at, c.problems_release_at, c.roster_lock_at, c.submissions_open_at, c.deadline_at]
      .map((at) => (at ? new Date(at).getTime() - now : -1))
      .filter((ms) => ms > 0);
    if (!due.length) return;
    // setTimeout overflows past ~24.8 days; waking once a day until then is harmless
    const id = setTimeout(() => setTick((n) => n + 1), Math.min(Math.min(...due) + 250, 86_400_000));
    return () => clearTimeout(id);
  }, [state, tick]);

  const load = useCallback(async () => {
    const supabase = supabaseBrowser();
    // Supabase unreachable makes the client throw rather than return an error: show the message, not "Cooking" forever
    let session, me, crew, cfg, clock, t0;
    try {
      // the stored session is enough to know who to load: the proxy already verified it on this request, and the
      // database checks the token on every query below anyway. Saves a round trip to Auth before the real loading.
      ({ data: { session } } = await supabase.auth.getSession());
      if (!session) {
        router.replace("/login?next=/dashboard");
        return;
      }
      t0 = Date.now();
      [me, crew, cfg, clock] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.rpc("my_crew"),
        supabase.from("event_config").select("*").eq("id", 1).single(),
        supabase.rpc("server_time"),
      ]);
    } catch {
      setFailed(true);
      return;
    }
    // a stale session the database refused: sign in again rather than "Couldn't reach the lab"
    if (me.error?.code === "PGRST301" || me.status === 401) {
      router.replace("/login?next=/dashboard");
      return;
    }
    if (me.error || cfg.error) {
      setFailed(true);
      return;
    }
    // half the round trip is a fair guess for when the server read its clock
    const offset = clock.data ? new Date(clock.data).getTime() - (t0 + (Date.now() - t0) / 2) : 0;
    setState({ me: me.data, crew: (crew.data as Crew | null) ?? null, cfg: cfg.data, offset });
  }, [router]);

  useEffect(() => {
    void (async () => load())();
  }, [load]);

  // first sign-in: name yourself before anything else
  useEffect(() => {
    if (state && !state.me.onboarded) router.replace("/onboarding");
  }, [state, router]);

  const value = useMemo<Lab | null>(
    () =>
      state && {
        ...state,
        now: () => Date.now() + state.offset,
        isLeader: !!state.crew && state.crew.leader_id === state.me.id,
        reload: load,
      },
    [state, load, tick], // eslint-disable-line react-hooks/exhaustive-deps -- tick only forces the refresh
  );

  if (failed) {
    return <p className="p-8 text-center font-type text-paper">Couldn&apos;t reach the lab. Refresh to try again.</p>;
  }
  if (!value || !value.me.onboarded) {
    return (
      <div className="grid min-h-svh place-items-center">
        <p className="animate-pulse font-type text-sm uppercase tracking-[0.4em] text-paper/70">Cooking</p>
      </div>
    );
  }
  return <LabContext.Provider value={value}>{children}</LabContext.Provider>;
}

/** The milestones in order, with what the countdown should say before each one. */
export function milestones(cfg: EventConfig) {
  return [
    { at: cfg.supplier_pick_at, label: "Suppliers open in" },
    { at: cfg.problems_release_at, label: "Problems drop in" },
    { at: cfg.submissions_open_at, label: "Dead Drop opens in" },
    { at: cfg.deadline_at, label: "Cook stops in", deadline: true },
  ].filter((m): m is { at: string; label: string; deadline?: boolean } => !!m.at);
}

export function nextMilestone(cfg: EventConfig, now: number) {
  return milestones(cfg).find((m) => new Date(m.at).getTime() > now) ?? null;
}

/** What ProfileForm starts from. */
export const profileInitial = (p: Profile) => ({ name: p.display_name, phone: p.phone ?? "", linkedin: p.linkedin_url ?? "", github: p.github_url ?? "" });

export const passed = (at: string | null | undefined, now: number) => !!at && new Date(at).getTime() <= now;
