"use client";
/* eslint-disable @next/next/no-img-element -- small admin thumbnails from Supabase Storage */

import { useEffect, useState } from "react";
import { Btn, ErrorLine, H1, adminDb, gulf } from "./AdminShell";
import { TableEditor, type Col } from "./TableEditor";

type Opt = { value: string; label: string };
const opts = (xs: string[]) => xs.map((x) => ({ value: x, label: x }));
const logoUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sponsor-logos/${path}`;

function useOptions(table: string, label: string, filter?: [string, unknown]) {
  const [o, setO] = useState<Opt[]>([]);
  useEffect(() => {
    let q = adminDb().from(table).select(`id, ${label}`);
    if (filter) q = q.eq(filter[0], filter[1]);
    void q.then(({ data }) => setO(((data ?? []) as unknown as Record<string, string>[]).map((r) => ({ value: r.id, label: r[label] }))));
  }, [table, label]); // eslint-disable-line react-hooks/exhaustive-deps -- filter is a literal per page
  return o;
}

// ─── sponsors ─────────────────────────────────────────────────────────────────────────────────────────────────
export function AdminSponsors() {
  const [error, setError] = useState<string | null>(null);
  const cols: Col[] = [
    { key: "name", label: "Name", required: true },
    { key: "symbol", label: "Symbol (Dv)", placeholder: "Two letters, e.g. Dv", nullable: true },
    { key: "tier", label: "Tier", type: "select", required: true, options: opts(["title", "track", "food", "perk"]) },
    { key: "is_supplier", label: "Supplier (crews pick it)", type: "bool" },
    { key: "website", label: "Website", placeholder: "https://…", nullable: true },
    { key: "sort_order", label: "Order", type: "number" },
    { key: "visible", label: "Visible", type: "bool" },
    { key: "logo_path", label: "Logo", tableOnly: true, render: (r) => (r.logo_path ? <img src={logoUrl(String(r.logo_path))} alt="" className="h-8 max-w-24 object-contain" /> : <span className="text-paper-dim">—</span>) },
  ];

  const upload = async (row: Record<string, unknown>, file: File, reload: () => void) => {
    setError(await uploadLogo(String(row.id), file));
    reload();
  };

  return (
    <div>
      <H1 sub="Suppliers are the companies crews pick and that set problem statements. Logos: PNG/WebP/JPEG up to 2 MB (no SVG).">Sponsors</H1>
      <ErrorLine text={error} />
      <TableEditor table="sponsors" cols={cols}
        order={[["sort_order"], ["name"]]} defaults={{ tier: "track", visible: true, is_supplier: true, sort_order: 0 }}
        extra={(r, reload) => (
          <label className="inline-block cursor-pointer rounded border border-paper/25 px-3 py-1.5 text-sm hover:bg-paper/10">
            Upload logo
            <input type="file" accept="image/png,image/webp,image/jpeg" className="hidden" onChange={(e) => e.target.files?.[0] && upload(r, e.target.files[0], reload)} />
          </label>
        )} />
    </div>
  );
}

// the bucket also enforces type and size; checked here first for a friendlier message. A fresh name per upload
// so browsers and the CDN never show a stale logo.
async function uploadLogo(sponsorId: string, file: File) {
  if (!/^image\/(png|webp|jpeg)$/.test(file.type) || file.size > 2 * 1024 * 1024) return "Logos must be PNG, WebP or JPEG, 2 MB at most.";
  const path = `${sponsorId}-${Date.now()}.${file.type.split("/")[1].replace("jpeg", "jpg")}`;
  const up = await adminDb().storage.from("sponsor-logos").upload(path, file, { contentType: file.type });
  if (up.error) return up.error.message;
  const { error } = await adminDb().from("sponsors").update({ logo_path: path }).eq("id", sponsorId);
  return error?.message ?? null;
}

// ─── problems ─────────────────────────────────────────────────────────────────────────────────────────────────
export function AdminProblems() {
  const sponsors = useOptions("sponsors", "name", ["is_supplier", true]);
  return (
    <div>
      <H1 sub="Hidden from crews until the drop time, and only if published. Text is shown as plain text (no HTML).">Problems</H1>
      <TableEditor table="problems" order={[["id"]]} defaults={{ is_published: false, summary: "", body_md: "", criteria_md: "" }} cols={[
        { key: "id", label: "Code (D-001)", required: true, createOnly: true, placeholder: "D-001" },
        { key: "sponsor_id", label: "Supplier", type: "select", required: true, options: sponsors },
        { key: "title", label: "Title", required: true },
        { key: "track", label: "Track", nullable: true },
        { key: "capacity", label: "Max crews (blank = no cap)", type: "number" },
        { key: "is_published", label: "Published", type: "bool" },
        { key: "summary", label: "Summary", type: "textarea", formOnly: true },
        { key: "body_md", label: "Full statement", type: "textarea", formOnly: true },
        { key: "criteria_md", label: "Judging criteria", type: "textarea", formOnly: true },
      ]} />
    </div>
  );
}

// ─── prizes ───────────────────────────────────────────────────────────────────────────────────────────────────
export function AdminPrizes() {
  const crews = useOptions("teams", "name");
  return (
    <div>
      <H1 sub="Cash prizes split the pool (Event page) by ratio unless an amount is set. Perks are non-cash awards. Student-only = Jesse crews.">Prizes</H1>
      <TableEditor table="prizes" order={[["rank"]]} defaults={{ kind: "cash", rank: 1 }} cols={[
        { key: "rank", label: "Rank", type: "number", required: true },
        { key: "name", label: "Name", required: true },
        { key: "kind", label: "Kind", type: "select", required: true, options: opts(["cash", "perk"]) },
        { key: "ratio", label: "Share of pool", type: "number" },
        { key: "amount_aed", label: "Fixed amount (AED)", type: "number" },
        { key: "category_only", label: "Only for", type: "select", options: [{ value: "jesse", label: "Jesse (students)" }] },
        { key: "perk_description", label: "Perk / description", nullable: true },
        { key: "awarded_team_id", label: "Awarded to", type: "select", options: crews },
      ]} />
    </div>
  );
}

// ─── site content ─────────────────────────────────────────────────────────────────────────────────────────────
export function AdminContent() {
  return (
    <div className="space-y-12">
      <section>
        <H1 sub="Shown in the dashboard Overview, newest first; pinned ones on top.">Announcements</H1>
        <TableEditor table="announcements" order={[["pinned", false], ["created_at", false]]} defaults={{ pinned: false }} cols={[
          { key: "body", label: "Message", type: "textarea", required: true },
          { key: "pinned", label: "Pinned", type: "bool" },
          { key: "created_at", label: "Posted", tableOnly: true, render: (r) => <span>{gulf(String(r.created_at ?? ""))}</span> },
        ]} />
      </section>
      <section>
        <H1 sub="The FAQ evidence in the pool, in order.">FAQ</H1>
        <TableEditor table="faqs" order={[["sort_order"]]} defaults={{ visible: true, sort_order: 0 }} cols={[
          { key: "sort_order", label: "Order", type: "number" },
          { key: "q", label: "Question", required: true },
          { key: "a", label: "Answer", type: "textarea", required: true },
          { key: "visible", label: "Visible", type: "bool" },
        ]} />
      </section>
      <section>
        <H1 sub="The fuse timeline. Day 0 = first day; times are local (HH:MM).">Schedule</H1>
        <TableEditor table="schedule_items" order={[["sort_order"]]} defaults={{ day_offset: 0, sort_order: 0, detail: "" }} cols={[
          { key: "sort_order", label: "Order", type: "number" },
          { key: "day_offset", label: "Day", type: "number", required: true },
          { key: "time_label", label: "Time (HH:MM)", required: true, placeholder: "12:00" },
          { key: "end_label", label: "Until (HH:MM)", placeholder: "18:00", nullable: true },
          { key: "title", label: "Title", required: true },
          { key: "detail", label: "Detail" },
        ]} />
      </section>
    </div>
  );
}

// ─── universities ─────────────────────────────────────────────────────────────────────────────────────────────
export function AdminUniversities() {
  return (
    <div>
      <H1 sub={<>Emails on these domains sign in as Jesse (student). Use % as a wildcard: <code>%.bits-pilani.ac.in</code>. Changes re-check everyone (except hand-set categories).</>}>Partner universities</H1>
      <TableEditor table="partner_universities" order={[["name"]]} defaults={{ active: true }} cols={[
        { key: "name", label: "Name", required: true },
        { key: "domain_pattern", label: "Email domain", required: true, placeholder: "dubai.bits-pilani.ac.in" },
        { key: "active", label: "Active", type: "bool" },
      ]} />
    </div>
  );
}

// ─── audit log ────────────────────────────────────────────────────────────────────────────────────────────────
type Audit = { id: number; admin_id: string | null; action: string; target_table: string; target_id: string | null; before: unknown; after: unknown; created_at: string };

export function AdminAudit() {
  const [rows, setRows] = useState<Audit[] | null>(null);
  const [who, setWho] = useState<Record<string, string>>({});
  useEffect(() => {
    const db = adminDb();
    void db.from("admin_audit").select("*").order("created_at", { ascending: false }).limit(300).then(async ({ data }) => {
      const list = (data ?? []) as Audit[];
      setRows(list);
      const ids = [...new Set(list.map((r) => r.admin_id).filter(Boolean))] as string[];
      if (ids.length) {
        const { data: p } = await db.from("profiles").select("id, email").in("id", ids);
        setWho(Object.fromEntries(((p ?? []) as { id: string; email: string }[]).map((x) => [x.id, x.email])));
      }
    });
  }, []);
  return (
    <div>
      <H1 sub="Every admin write, newest first (last 300).">Audit log</H1>
      {!rows ? <p className="text-paper-dim">Loading…</p> : (
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id}>
              <details className="rounded border border-paper/15 px-3 py-2">
                <summary className="cursor-pointer">
                  <span className="text-paper-dim">{gulf(r.created_at)}</span> · {who[r.admin_id ?? ""] ?? "admin"} ·{" "}
                  <span className="text-crystal">{r.action}</span> {r.target_table} <span className="text-paper-dim">{r.target_id}</span>
                </summary>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <pre className="overflow-x-auto rounded bg-ink-soft p-2 text-xs">{JSON.stringify(r.before, null, 2) ?? "—"}</pre>
                  <pre className="overflow-x-auto rounded bg-ink-soft p-2 text-xs">{JSON.stringify(r.after, null, 2) ?? "—"}</pre>
                </div>
              </details>
            </li>
          ))}
          {!rows.length && <li className="text-paper-dim">Nothing yet.</li>}
        </ul>
      )}
      <Btn className="mt-4" onClick={() => location.reload()}>Refresh</Btn>
    </div>
  );
}
