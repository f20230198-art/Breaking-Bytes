"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Btn, ErrorLine, adminDb, fromGulfInput, gulf, inputCls, toGulfInput } from "./AdminShell";

type Row = Record<string, unknown>;
export type Col = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "bool" | "select" | "datetime";
  options?: { value: string; label: string }[]; // for select; "" = null
  required?: boolean;
  /** only settable when creating (e.g. a text primary key) */
  createOnly?: boolean;
  /** hide from the table (still in the form) */
  formOnly?: boolean;
  /** show in the table only: never in the form, never written (uploads, timestamps) */
  tableOnly?: boolean;
  /** an empty box saves as null (optional columns with a format check, e.g. a URL) */
  nullable?: boolean;
  placeholder?: string;
  render?: (row: Row) => ReactNode;
};

/**
 * List + create + edit + delete for one table, straight through RLS (admins only) with every write audited by the
 * database. Constraint errors come back as the database's own message, which is fine for organisers.
 */
export function TableEditor({ table, cols, order = [], pk = "id", defaults = {}, extra }: {
  table: string; cols: Col[]; order?: [string, boolean?][]; pk?: string; defaults?: Row; extra?: (row: Row, reload: () => void) => ReactNode;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // keyed on the order's contents: callers pass a fresh array literal on every render
  const orderKey = JSON.stringify(order);
  const load = useCallback(async () => {
    let q = adminDb().from(table).select("*");
    for (const [c, asc = true] of JSON.parse(orderKey) as [string, boolean?][]) q = q.order(c, { ascending: asc });
    const { data, error } = await q;
    if (error) setError(error.message);
    setRows(data ?? []);
  }, [table, orderKey]);

  useEffect(() => {
    void (async () => load())();
  }, [load]);

  const remove = async (row: Row) => {
    if (!window.confirm("Delete this row? This can't be undone (it stays in the audit log).")) return;
    const { error } = await adminDb().from(table).delete().eq(pk, row[pk]);
    if (error) setError(error.message);
    void load();
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Btn tone="primary" onClick={() => setEditing("new")}>Add</Btn>
        <span className="text-sm text-paper-dim">{rows ? `${rows.length} rows` : "Loading…"}</span>
      </div>
      <ErrorLine text={error} />
      {editing && (
        <RowForm table={table} cols={cols} pk={pk} row={editing === "new" ? { ...defaults } : editing} isNew={editing === "new"}
          onDone={() => { setEditing(null); void load(); }} />
      )}
      <div className="mt-3 overflow-x-auto rounded border border-paper/15">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper/5 text-xs uppercase tracking-wider text-paper-dim">
            <tr>
              {cols.filter((c) => !c.formOnly).map((c) => <th key={c.key} className="px-3 py-2 font-medium">{c.label}</th>)}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={String(r[pk])} className="border-t border-paper/10 align-top">
                {cols.filter((c) => !c.formOnly).map((c) => (
                  <td key={c.key} className="max-w-xs px-3 py-2">
                    {c.render ? c.render(r) : <Cell col={c} value={r[c.key]} />}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  {extra?.(r, () => void load())}
                  <Btn className="ml-2" onClick={() => setEditing(r)}>Edit</Btn>
                  <Btn className="ml-2" tone="danger" onClick={() => remove(r)}>Delete</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ col, value }: { col: Col; value: unknown }) {
  if (value === null || value === undefined || value === "") return <span className="text-paper-dim">—</span>;
  if (col.type === "bool") return <span>{value ? "yes" : "no"}</span>;
  if (col.type === "datetime") return <span>{gulf(String(value))}</span>;
  if (col.type === "select") return <span>{col.options?.find((o) => o.value === value)?.label ?? String(value)}</span>;
  return <span className="line-clamp-3 break-words">{String(value)}</span>;
}

function RowForm({ table, cols, pk, row, isNew, onDone }: { table: string; cols: Col[]; pk: string; row: Row; isNew: boolean; onDone: () => void }) {
  const [draft, setDraft] = useState<Row>(row);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const payload: Row = {};
    for (const c of cols) {
      if (c.tableOnly || (!isNew && c.createOnly)) continue;
      let v = draft[c.key];
      if (c.type === "number") v = v === "" || v === null || v === undefined ? null : Number(v);
      if (c.type === "select" && v === "") v = null;
      if (typeof v === "string" && v.trim() === "" && c.nullable) v = null;
      payload[c.key] = v ?? (c.type === "bool" ? false : c.nullable || c.type === "number" || c.type === "select" || c.type === "datetime" ? null : "");
    }
    const db = adminDb().from(table);
    const { error } = isNew ? await db.insert(payload) : await db.update(payload).eq(pk, row[pk]);
    setBusy(false);
    if (error) return setError(error.message);
    onDone();
  };

  return (
    <form onSubmit={save} className="mt-3 grid gap-3 rounded border border-crystal/40 bg-paper/5 p-4 sm:grid-cols-2">
      {cols.filter((c) => !c.tableOnly).map((c) => {
        const v = draft[c.key];
        const disabled = !isNew && c.createOnly;
        return (
          <label key={c.key} className={`block text-sm ${c.type === "textarea" ? "sm:col-span-2" : ""}`}>
            <span className="text-xs uppercase tracking-wider text-paper-dim">{c.label}{c.required ? " *" : ""}</span>
            <div className="mt-1">
              {c.type === "textarea" ? (
                <textarea className={inputCls} rows={5} value={String(v ?? "")} onChange={(e) => set(c.key, e.target.value)} required={c.required} placeholder={c.placeholder} />
              ) : c.type === "bool" ? (
                <input type="checkbox" checked={!!v} onChange={(e) => set(c.key, e.target.checked)} className="size-4 accent-crystal" />
              ) : c.type === "select" ? (
                <select className={inputCls} value={String(v ?? "")} onChange={(e) => set(c.key, e.target.value)} required={c.required}>
                  {!c.required && <option value="">—</option>}
                  {c.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : c.type === "datetime" ? (
                <input type="datetime-local" className={inputCls} value={toGulfInput((v as string) ?? null)} onChange={(e) => set(c.key, fromGulfInput(e.target.value))} />
              ) : (
                <input className={inputCls} type={c.type === "number" ? "number" : "text"} step="any" value={String(v ?? "")} disabled={disabled}
                  onChange={(e) => set(c.key, e.target.value)} required={c.required} placeholder={c.placeholder} />
              )}
            </div>
          </label>
        );
      })}
      <div className="flex gap-2 sm:col-span-2">
        <Btn tone="primary" disabled={busy}>{busy ? "Saving…" : isNew ? "Create" : "Save"}</Btn>
        <Btn type="button" onClick={onDone}>Cancel</Btn>
      </div>
      <div className="sm:col-span-2"><ErrorLine text={error} /></div>
    </form>
  );
}
