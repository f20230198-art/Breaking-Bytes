"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { safeNext } from "@/lib/safeNext";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Google is the only door in. (University accounts are still detected as Jesse on the server; IDs are checked at the door.) */
export function LoginCard() {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const failed = params.get("error") === "auth";

  const signIn = async () => {
    setBusy(true);
    const next = safeNext(params.get("next"));
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) setBusy(false);
  };

  return (
    <div className="w-full max-w-sm border-[3px] border-ink bg-paper p-6 text-ink print-shadow">
      <p className="font-type text-xs uppercase tracking-[0.3em] text-brick">The lab · sign in</p>
      <h1 className="mt-2 font-display text-3xl leading-tight">Say my name.</h1>
      <p className="mt-3 font-type text-sm">
        Sign in with Google, then start or join a crew. Students: bring your university ID on the day.
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
      <p className="mt-3 font-type text-xs text-ink/60">
        We only use your details to run the event. <Link href="/privacy" className="underline underline-offset-2">Privacy</Link>
      </p>
      {/* never in a production build, whatever the flag says */}
      {process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_LOGIN === "1" && <DevLogin next={safeNext(params.get("next"))} />}
    </div>
  );
}

/**
 * Local development only (NEXT_PUBLIC_DEV_LOGIN=1 in .env.local, against the local Supabase stack): email + password,
 * creating the account on first use, so the portal can be tested without Google. The hosted project has the email
 * provider switched off, so this form could not sign anyone in there even if the flag leaked.
 */
function DevLogin({ next }: { next: string }) {
  const [email, setEmail] = useState("walt@gmail.com");
  const [error, setError] = useState<string | null>(null);
  const go = async () => {
    const supabase = supabaseBrowser();
    const creds = { email, password: "say-my-name-dev" };
    let { error } = await supabase.auth.signInWithPassword(creds);
    if (error) ({ error } = await supabase.auth.signUp(creds));
    if (error) return setError(error.message);
    window.location.assign(next);
  };
  return (
    <div className="mt-6 border-t-2 border-dashed border-ink/30 pt-4">
      <p className="font-type text-xs uppercase tracking-[0.2em] text-ink/60">Dev login (local only)</p>
      <div className="mt-2 flex gap-2">
        <input value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Dev email"
          className="min-w-0 flex-1 border-2 border-ink bg-paper-dim/40 px-2 py-1.5 font-type text-sm" />
        <button type="button" onClick={go} className="border-2 border-ink bg-paper-dim px-3 font-display text-xs uppercase">Go</button>
      </div>
      <p className="mt-1 font-type text-[11px] text-ink/50">Try a @dubai.bits-pilani.ac.in address for a Jesse.</p>
      {error && <p className="mt-1 font-type text-xs text-brick">{error}</p>}
    </div>
  );
}
