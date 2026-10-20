import Link from "next/link";
import { Suspense } from "react";
import { supabaseServer } from "@/lib/supabase/server";

// placeholder until the portal is built: proves sign-in works end to end (the proxy already requires a session here)
export default function Dashboard() {
  return (
    <main className="grid min-h-svh place-items-center bg-ink px-4 text-center text-paper">
      <div>
        <p className="font-type text-xs uppercase tracking-[0.3em] text-rust">The lab</p>
        <h1 className="mt-3 font-display text-4xl sm:text-6xl">Opening soon.</h1>
        <Suspense fallback={<p className="mt-4 font-type text-paper-dim">Checking your badge…</p>}>
          <Who />
        </Suspense>
        <Link href="/" className="mt-8 inline-block border-[3px] border-ink bg-crystal px-6 py-3 font-display uppercase tracking-wider text-ink print-shadow">
          Back to the desert
        </Link>
      </div>
    </main>
  );
}

async function Who() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: me } = await supabase.from("profiles").select("display_name, category, role").eq("id", auth.user.id).single();
  return (
    <div className="mx-auto mt-4 max-w-sm font-type text-paper-dim">
      <p>
        Signed in as <span className="text-paper">{me?.display_name || auth.user.email}</span>, a{" "}
        <span className="text-crystal">{me?.category === "jesse" ? "Jesse (student)" : "Walter"}</span>
        {me?.role === "admin" ? " · admin" : ""}.
      </p>
      <form action="/auth/signout" method="post" className="mt-3">
        <button className="underline underline-offset-4 hover:text-paper">Sign out</button>
      </form>
    </div>
  );
}
