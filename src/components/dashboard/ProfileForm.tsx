"use client";

import { useState, type FormEvent } from "react";
import { githubOk, linkedinOk, normaliseGithub, normaliseLinkedin } from "@/lib/profileLinks";
import { rpcMessage } from "@/lib/rpcErrors";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button, Field, Notice } from "./ui";

type Initial = { name: string; phone: string; linkedin: string; github: string };

/** Name, LinkedIn / GitHub (one required) and optional phone, saved through update_profile (onboarding and Profile). */
export function ProfileForm({ initial, cta, onSaved }: { initial: Initial; cta: string; onSaved: () => void }) {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [linkedin, setLinkedin] = useState(initial.linkedin);
  const [github, setGithub] = useState(initial.github);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const li = normaliseLinkedin(linkedin);
    const gh = normaliseGithub(github);
    setLinkedin(li); setGithub(gh);
    setOk(false);
    if (!li && !gh) return setError(rpcMessage({ message: "need_a_link" }));
    if (li && !linkedinOk(li)) return setError(rpcMessage({ message: "bad_linkedin" }));
    if (gh && !githubOk(gh)) return setError(rpcMessage({ message: "bad_github" }));
    setBusy(true); setError(null);
    const { error } = await supabaseBrowser().rpc("update_profile", {
      p_display_name: name, p_phone: phone || undefined, p_linkedin: li || undefined, p_github: gh || undefined,
    });
    setBusy(false);
    if (error) return setError(rpcMessage(error));
    setOk(true);
    onSaved();
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required hint="What your crew and the organisers see." />
      <p className="border-2 border-dashed border-ink/30 p-3 font-type text-sm text-ink/80">
        Seats are limited. Add your LinkedIn and GitHub: at least one is required, both is better.
      </p>
      <Field label="LinkedIn" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} onBlur={() => setLinkedin(normaliseLinkedin(linkedin))}
        maxLength={340} placeholder="linkedin.com/in/your-name" inputMode="url" autoCapitalize="none" spellCheck={false} />
      <Field label="GitHub" value={github} onChange={(e) => setGithub(e.target.value)} onBlur={() => setGithub(normaliseGithub(github))}
        maxLength={80} placeholder="github.com/your-username" inputMode="url" autoCapitalize="none" spellCheck={false} />
      <Field label="Phone (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="+971 50 000 0000" hint="Only organisers can see it, for event-day emergencies." />
      {error && <Notice>{error}</Notice>}
      {ok && <Notice tone="ok">Saved.</Notice>}
      <Button type="submit" disabled={busy || name.trim().length < 2 || !(linkedin.trim() || github.trim())}>{busy ? "Saving…" : cta}</Button>
    </form>
  );
}
