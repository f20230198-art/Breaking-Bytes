"use client";
/* eslint-disable @next/next/no-img-element -- tiny pre-blurred backdrop */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { CategoryBadge, Kicker } from "@/components/dashboard/ui";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

/** First sign-in: one screen. Name yourself, see whether you're a Walter or a Jesse, and go in. */
export default function Onboarding() {
  const router = useRouter();
  const [me, setMe] = useState<Tables<"profiles"> | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.replace("/login?next=/onboarding");
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      if (p?.onboarded) return router.replace("/dashboard");
      setMe(p);
    });
  }, [router]);

  return (
    <main className="relative grid min-h-svh place-items-center bg-ink px-4 py-10">
      {me && <img src={`/scenes/dashboard/${me.category}.webp`} alt="" aria-hidden className="fixed inset-0 h-full w-full scale-110 object-cover" />}
      <div aria-hidden className="fixed inset-0 bg-ink/55" />
      {me && (
        <div className="relative w-full max-w-md border-[3px] border-ink bg-paper p-6 text-ink print-shadow">
          <Kicker>First day in the lab</Kicker>
          <h1 className="mt-1 font-display text-3xl">Who&apos;s cooking?</h1>
          <div className="mt-4 border-2 border-dashed border-ink/30 p-3">
            <CategoryBadge category={me.category} />
            <p className="mt-2 font-type text-sm">
              {me.category === "jesse"
                ? "You're a Jesse: partner-university email detected. Your crew can also win the student prizes, as long as everyone in it is a Jesse."
                : "You're a Walter: the open category. Student at a partner university? Sign out and use your university Google account instead."}
            </p>
          </div>
          <div className="mt-5">
            <ProfileForm name={me.display_name} phone={me.phone ?? ""} cta="Enter the lab" onSaved={() => router.replace("/dashboard")} />
          </div>
        </div>
      )}
    </main>
  );
}
