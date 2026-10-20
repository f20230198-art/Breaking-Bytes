import Link from "next/link";

// placeholder until the portal is built (next phase), so "Enter the lab" and "Register your crew" don't 404
export default function Dashboard() {
  return (
    <main className="grid min-h-svh place-items-center bg-ink px-4 text-center text-paper">
      <div>
        <p className="font-type text-xs uppercase tracking-[0.3em] text-rust">The lab</p>
        <h1 className="mt-3 font-display text-4xl sm:text-6xl">Opening soon.</h1>
        <p className="mx-auto mt-4 max-w-sm font-type text-paper-dim">Registration and the crew portal are being cooked. Check back shortly.</p>
        <Link href="/" className="mt-8 inline-block border-[3px] border-ink bg-crystal px-6 py-3 font-display uppercase tracking-wider text-ink print-shadow">
          Back to the desert
        </Link>
      </div>
    </main>
  );
}
