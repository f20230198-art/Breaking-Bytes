"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { rpcMessage } from "@/lib/rpcErrors";
import type { Tables } from "@/types/database";
import { Btn, ErrorLine, H1, adminDb, inputCls } from "./AdminShell";

type Profile = Tables<"profiles">;

/** Everyone who has signed in: ban / unban, set Walter or Jesse by hand, and the admin allowlist. */
export function AdminUsers() {
  const [rows, setRows] = useState<Profile[] | null>(null);
  const [admins, setAdmins] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [newAdmin, setNewAdmin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const db = adminDb();
    const [p, a] = await Promise.all([db.from("profiles").select("*").order("created_at", { ascending: false }), db.from("admin_emails").select("email").order("email")]);
    if (p.error) setError(p.error.message);
    setRows((p.data as Profile[]) ?? []);
    setAdmins(((a.data ?? []) as { email: string }[]).map((x) => x.email));
  }, []);
  useEffect(() => {
    void (async () => load())();
  }, [load]);

  const run = async (op: PromiseLike<{ error: { message: string } | null }>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    const { error } = await op;
    if (error) setError(error.message);
    void load();
  };
  const profiles = () => adminDb().from("profiles");
  const remove = async (r: Profile) => {
    if (!window.confirm(`Delete ${r.email} for good? Their account and profile are erased and they leave their crew (it passes to the next member, or is deleted if they were alone). They can still sign up again: to keep someone out, ban them instead.`)) return;
    setError(null);
    const { error } = await adminDb().rpc("admin_delete_user", { p_user: r.id });
    if (error) setError(rpcMessage(error));
    void load();
  };

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => !s || `${r.display_name} ${r.email}`.toLowerCase().includes(s));
  }, [rows, q]);

  return (
    <div>
      <H1 sub="Categories come from the email domain (partner universities). Setting one by hand pins it.">Users</H1>
      <input className={`${inputCls} mb-4 max-w-xs`} placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      <ErrorLine text={error} />
      <div className="overflow-x-auto rounded border border-paper/15">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper/5 text-xs uppercase tracking-wider text-paper-dim">
            <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Phone</th><th className="px-3 py-2">Links</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Role</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className={`border-t border-paper/10 ${r.banned ? "text-siren" : ""}`}>
                <td className="px-3 py-2">{r.display_name || "—"}{r.banned ? " (banned)" : ""}</td>
                <td className="px-3 py-2 text-paper-dim">{r.email}</td>
                <td className="px-3 py-2 text-paper-dim">{r.phone ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  {r.linkedin_url ? <a href={r.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-crystal underline">LinkedIn</a> : <span className="text-paper-dim">no LinkedIn</span>}
                  {" · "}
                  {r.github_url ? <a href={r.github_url} target="_blank" rel="noopener noreferrer" className="text-crystal underline">GitHub</a> : <span className="text-paper-dim">no GitHub</span>}
                </td>
                <td className="px-3 py-2">
                  <select className={inputCls} value={r.category}
                    onChange={(e) => run(profiles().update({ category: e.target.value, category_override: true }).eq("id", r.id))}>
                    <option value="walter">walter</option>
                    <option value="jesse">jesse</option>
                  </select>
                  {r.category_override && <span className="text-xs text-paper-dim">set by hand</span>}
                </td>
                <td className="px-3 py-2">{r.role}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <Btn tone="danger" onClick={() => void remove(r)}>Delete</Btn>{" "}
                  <Btn tone={r.banned ? "primary" : "danger"} onClick={() => run(profiles().update({ banned: !r.banned }).eq("id", r.id), r.banned ? undefined : `Ban ${r.email}? They can't act anywhere on the site.`)}>
                    {r.banned ? "Unban" : "Ban"}
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 font-display text-lg">Admin emails</h2>
      <p className="mt-1 text-sm text-paper-dim">Anyone signing in with one of these gets the admin role. Removing one revokes it.</p>
      <ul className="mt-3 space-y-2 text-sm">
        {admins.map((e) => (
          <li key={e} className="flex items-center gap-3">
            <span>{e}</span>
            <Btn tone="danger" onClick={() => run(adminDb().from("admin_emails").delete().eq("email", e), `Remove admin access for ${e}?`)}>Remove</Btn>
          </li>
        ))}
      </ul>
      <form className="mt-3 flex max-w-md gap-2" onSubmit={(e) => { e.preventDefault(); void run(adminDb().from("admin_emails").insert({ email: newAdmin.trim().toLowerCase() })); setNewAdmin(""); }}>
        <input className={inputCls} type="email" required placeholder="organiser@example.com" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} />
        <Btn tone="primary">Add admin</Btn>
      </form>
    </div>
  );
}
