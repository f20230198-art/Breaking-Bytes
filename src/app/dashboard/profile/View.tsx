"use client";

import { useEffect, useState } from "react";
import { profileInitial, useLab } from "@/components/dashboard/LabProvider";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { Card, CategoryBadge, Kicker, Title } from "@/components/dashboard/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

export function ProfilePage() {
  const { me, cfg, reload } = useLab();
  const [uni, setUni] = useState<string | null>(null);
  useEffect(() => {
    if (!me.university_id) return;
    void supabaseBrowser().from("partner_universities").select("name").eq("id", me.university_id).maybeSingle()
      .then(({ data }) => setUni(data?.name ?? null));
  }, [me.university_id]);

  return (
    <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
      <Card>
        <Kicker>Profile</Kicker>
        <Title>Your badge</Title>
        <div className="mt-5">
          <ProfileForm initial={profileInitial(me)} cta="Save" onSaved={() => void reload()} />
        </div>
      </Card>
      <Card>
        <Kicker>Account</Kicker>
        <p className="mt-3 font-type text-xs uppercase tracking-[0.2em] text-ink/60">Signed in as</p>
        <p className="break-all font-type">{me.email}</p>
        {/* pre-registration: students show their university ID at the door; the online split comes back with the portal */}
        {cfg.portal_open ? (
          <>
            <p className="mt-4 font-type text-xs uppercase tracking-[0.2em] text-ink/60">Category</p>
            <div className="mt-1"><CategoryBadge category={me.category} /></div>
            <p className="mt-2 font-type text-sm text-ink/70">
              {me.category === "jesse"
                ? `Verified student${uni ? ` at ${uni}` : ""}: your crew can also win the student prizes, as long as everyone in it is a Jesse.`
                : "Open category. Student at a partner university? Sign out and sign back in with your university Google account."}
            </p>
          </>
        ) : (
          <p className="mt-4 font-type text-sm text-ink/70">Students: bring your university ID on the day.</p>
        )}
        <form action="/auth/signout" method="post" className="mt-6">
          <button className="font-display text-sm uppercase tracking-wider text-brick underline underline-offset-4">Sign out</button>
        </form>
      </Card>
    </div>
  );
}
