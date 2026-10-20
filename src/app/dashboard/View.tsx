"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { nextMilestone, passed, useLab } from "@/components/dashboard/LabProvider";
import { Card, CategoryBadge, Kicker, Stamp, Title } from "@/components/dashboard/ui";
import { Countdown } from "@/components/ui/Countdown";
import { supabaseBrowser } from "@/lib/supabase/client";

type Announcement = { id: string; body: string; pinned: boolean; created_at: string };

/** Overview: today's cook as a checklist, the next milestone, and word from the organisers. */
export function Overview() {
  const { me, crew, cfg, offset, now } = useLab();
  const [news, setNews] = useState<Announcement[]>([]);
  const [shipped, setShipped] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();
    void supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setNews(data ?? []));
    if (crew)
      void supabase.from("submissions").select("repo_url, live_url, video_url").eq("team_id", crew.id).maybeSingle()
        .then(({ data }) => setShipped(!!(data?.repo_url || data?.live_url || data?.video_url)));
  }, [crew]);

  const t = now();
  const next = nextMilestone(cfg, t);
  const steps = [
    { done: !!crew, label: "Crew formed", href: "/dashboard/crew" },
    { done: !!crew?.sponsor_id, label: "Supplier picked", href: "/dashboard/formula" },
    { done: !!crew?.problem_id || (passed(cfg.problems_release_at, t) && !!crew?.sponsor_id), label: "Problem revealed", href: "/dashboard/formula" },
    { done: shipped, label: "Links submitted", href: "/dashboard/submit" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <Kicker>Today&apos;s cook</Kicker>
        <Title>Welcome to the lab, {me.display_name.split(" ")[0]}.</Title>
        <div className="mt-3"><CategoryBadge category={me.category} /></div>
        <ol className="mt-6 space-y-3">
          {steps.map((s, i) => (
            <li key={s.label}>
              <Link href={s.href} className="group flex items-center gap-3">
                <span className={`grid size-8 shrink-0 place-items-center border-[3px] border-ink font-display ${s.done ? "bg-olive text-paper" : "bg-paper"}`}>
                  {s.done ? "✓" : i + 1}
                </span>
                <span className={`font-type ${s.done ? "text-ink/50 line-through" : "group-hover:underline"}`}>{s.label}</span>
              </Link>
            </li>
          ))}
        </ol>
        {steps.every((s) => s.done) && <div className="mt-5"><Stamp tone="olive">99.1% pure</Stamp></div>}
      </Card>

      <div className="space-y-6">
        <Card tone="ink">
          {next ? (
            <>
              <Countdown to={next.at} offsetMs={offset} label={next.label} urgent={next.deadline} />
              <p className="mt-3 font-type text-sm text-paper-dim">
                {new Date(next.at).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" })} Gulf time
              </p>
            </>
          ) : (
            <Title className="text-siren">The cook is over.</Title>
          )}
        </Card>
        <Card>
          <Kicker>From the organisers</Kicker>
          {news.length ? (
            <ul className="mt-3 space-y-3">
              {news.map((n) => (
                <li key={n.id} className="border-b-2 border-dashed border-ink/20 pb-3 font-type text-sm last:border-0 last:pb-0">
                  {n.pinned && <span className="mr-1 font-display text-xs uppercase text-brick">Pinned ·</span>}
                  {n.body}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 font-type text-sm text-ink/60">Nothing yet. Updates land here during the event.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
