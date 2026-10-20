"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Google is the only door in. University Google accounts are detected as Jesse (student) on the server. */
export function LoginCard() {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const failed = params.get("error") === "auth";

  const signIn = async () => {
    setBusy(true);
    const next = params.get("next") ?? "/dashboard";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) setBusy(false);
  };

  return (
    <div className="w-full max-w-sm border-[3px] border-ink bg-paper p-6 text-ink print-shadow">
      <p className="font-type text-xs uppercase tracking-[0.3em] text-brick">The lab · sign in</p>
      <h1 className="mt-2 font-display text-3xl leading-tight">Say my name.</h1>
      <p className="mt-3 font-type text-sm">
        Student at a partner university? Use your <strong>university Google account</strong> to compete for the student
        prizes too.
      </p>
      {failed && <p className="mt-3 border-2 border-brick px-3 py-2 font-type text-sm text-brick">That didn&apos;t work. Try again.</p>}
      <button
        type="button"
        onClick={signIn}
        disabled={busy}
        className="mt-6 w-full border-[3px] border-ink bg-crystal px-4 py-3 font-display uppercase tracking-wider text-ink print-shadow transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {busy ? "Opening Google…" : "Sign in with Google"}
      </button>
    </div>
  );
}
