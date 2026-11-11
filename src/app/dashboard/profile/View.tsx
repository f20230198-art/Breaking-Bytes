"use client";

import { profileInitial, useLab } from "@/components/dashboard/LabProvider";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { Card, Kicker, Title } from "@/components/dashboard/ui";

export function ProfilePage() {
  const { me, reload } = useLab();

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
        {/* no Walter / Jesse split on screen any more: every prize is open to everyone */}
        <p className="mt-4 font-type text-sm text-ink/70">Students: bring your university ID on the day.</p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button className="font-display text-sm uppercase tracking-wider text-brick underline underline-offset-4">Sign out</button>
        </form>
      </Card>
    </div>
  );
}
