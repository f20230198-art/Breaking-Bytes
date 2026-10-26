import Link from "next/link";
import type { ReactNode } from "react";
import { CLUB } from "@/data/site";

export const metadata = {
  title: "Privacy · Breaking Bytes",
  description: "What Breaking Bytes collects when you register, why, who sees it and how to have it deleted.",
};

/** Plain-language privacy policy: Google's consent screen links here, and so does the sign-in card. */
export default function Privacy() {
  return (
    <main className="min-h-svh bg-ink px-4 py-10 text-ink sm:py-16">
      <article className="mx-auto max-w-2xl border-[3px] border-ink bg-paper p-6 print-shadow sm:p-10">
        <p className="font-type text-xs uppercase tracking-[0.3em] text-brick">The fine print</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">Privacy</h1>
        <p className="mt-2 font-type text-sm text-ink/60">Last updated 26 October 2026</p>

        <Section title="Who we are">
          Breaking Bytes is a 24-hour student hackathon run by {CLUB.name} ({CLUB.short}). This page covers the
          registration site and the event portal.
        </Section>

        <Section title="What we collect">
          <ul className="list-disc space-y-1 pl-5">
            <li>From your Google sign-in: your name, email address and profile picture.</li>
            <li>What you enter: your display name, LinkedIn and/or GitHub profile link, and an optional phone number.</li>
            <li>Your crew: which crew you are in and whether you lead it.</li>
            <li>During the event: the links your crew submits (repository, demo, video) and any notes.</li>
          </ul>
          <p className="mt-3">No analytics, advertising or tracking cookies. The only cookies keep you signed in.</p>
        </Section>

        <Section title="Why">
          To register you and your crew, to decide who gets a seat when the hall is full (that is what the LinkedIn and
          GitHub links are for), to contact you about the event, and to run judging and prizes.
        </Section>

        <Section title="Who sees it">
          The organisers see everything above. Your crewmates see your name and picture, not your email, links or phone.
          Nobody else does. We never sell or share your data with sponsors or anyone else.
        </Section>

        <Section title="Where it lives">
          In our database on Supabase (Mumbai region). The site is served through Railway and Cloudflare, and sign-in is
          handled by Google.
        </Section>

        <Section title="How long">
          Until the event is wrapped up (results and prizes), then deleted within 90 days of the event. Ask earlier and we
          delete it earlier.
        </Section>

        <Section title="Your choices">
          You can edit your profile in the portal at any time. To see what we hold or have it deleted, email{" "}
          <a href={`mailto:${CLUB.email}`} className="underline underline-offset-2">{CLUB.email}</a>.
        </Section>

        <Link href="/" className="mt-8 inline-block border-[3px] border-ink bg-crystal px-5 py-2.5 font-display text-sm uppercase tracking-wider print-shadow">
          Back to the RV
        </Link>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-2 font-type text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}
