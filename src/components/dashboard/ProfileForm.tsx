"use client";

import { useState, type FormEvent } from "react";
import { rpcMessage } from "@/lib/rpcErrors";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button, Field, Notice } from "./ui";

/** Name + optional phone, saved through update_profile (shared by onboarding and the Profile page). */
export function ProfileForm({ name: initialName, phone: initialPhone, cta, onSaved }: { name: string; phone: string; cta: string; onSaved: () => void }) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null); setOk(false);
    const { error } = await supabaseBrowser().rpc("update_profile", { p_display_name: name, p_phone: phone || undefined });
    setBusy(false);
    if (error) return setError(rpcMessage(error));
    setOk(true);
    onSaved();
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required hint="What your crew and the judges see." />
      <Field label="Phone (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="+971 50 000 0000" hint="Only organisers can see it, for event-day emergencies." />
      {error && <Notice>{error}</Notice>}
      {ok && <Notice tone="ok">Saved.</Notice>}
      <Button type="submit" disabled={busy || name.trim().length < 2}>{busy ? "Saving…" : cta}</Button>
    </form>
  );
}
