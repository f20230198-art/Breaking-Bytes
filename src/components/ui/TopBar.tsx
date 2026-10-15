import Link from "next/link";
import { EVENT } from "@/data/site";
import { Countdown } from "./Countdown";

export function TopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 px-4 py-3 md:px-8">
      <Link href="/" className="flex items-center gap-1.5 font-display text-lg text-paper [text-shadow:2px_2px_0_#111]">
        <span className="grid size-8 place-items-center border-2 border-ink bg-olive text-sm text-paper">Br</span>
        <span className="hidden sm:inline">Breaking Bytes</span>
      </Link>
      <div className="flex items-center gap-3">
        <span className="hidden bg-ink/80 px-2 py-1 text-xs md:inline">
          <Countdown to={EVENT.startsAt} compact />
        </span>
        <Link
          href="/dashboard"
          className="border-2 border-ink bg-paper px-3 py-1.5 font-display text-xs uppercase tracking-wide text-ink print-shadow hover:bg-crystal"
        >
          Enter the lab
        </Link>
      </div>
    </header>
  );
}
