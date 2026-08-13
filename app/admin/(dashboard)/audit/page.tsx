"use client";

import { useCallback, useEffect, useState } from "react";
import { listAudit, type AuditEntry } from "@/lib/admin";

const ACTION_LABEL: Record<string, string> = {
  "user.status_changed": "Status changed",
  "user.password_reset": "Password reset",
  "user.deleted": "User deleted",
  "pricing.updated": "Pricing updated",
};

const ACTION_TONE: Record<string, string> = {
  "user.status_changed": "bg-amber-50 text-amber-700 border-amber-200",
  "user.password_reset": "bg-sage/10 text-sage-dark border-sage/30",
  "user.deleted": "bg-red-50 text-red-700 border-red-200",
  "pricing.updated": "bg-ink/5 text-ink border-ink/15",
};

function ActionBadge({ action }: { action: string }) {
  const tone = ACTION_TONE[action] || "bg-ink/5 text-ink border-ink/15";
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {ACTION_LABEL[action] || action}
    </span>
  );
}

function describeMeta(entry: AuditEntry) {
  const m = entry.meta || {};
  if (entry.action === "user.status_changed" && m.from && m.to) {
    return `${m.from} → ${m.to}`;
  }
  if (entry.action === "pricing.updated") {
    return `${m.b2cPacks ?? "?"} B2C · ${m.creditPacks ?? "?"} credit packs`;
  }
  if (entry.action === "user.deleted" && m.email) {
    return String(m.email);
  }
  if (m.role) return String(m.role);
  return "";
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listAudit({ page, action: action || undefined, q: q || undefined })
      .then((r) => {
        setLogs(r.logs);
        setActions(r.actions);
        setPages(r.pages);
        setTotal(r.total);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [page, action, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl">
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load();
        }}
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Search
          </span>
          <input
            value={q}
            maxLength={100}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Actor or target…"
            className="w-56 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-sage"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Action
          </span>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-sage"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABEL[a] || a}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-sage px-4 py-2 text-sm font-semibold text-paper transition hover:bg-sage-dark"
        >
          Apply
        </button>
      </form>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-muted">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                  Loading…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                  No audit entries yet.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-t border-ink/10 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                    {fmtTime(l.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-ink">{l.actorEmail || "—"}</td>
                  <td className="px-4 py-3">
                    <ActionBadge action={l.action} />
                  </td>
                  <td className="px-4 py-3 text-ink">{l.targetLabel || "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{describeMeta(l)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-ink-muted">
        <span>
          {total} {total === 1 ? "entry" : "entries"}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-ink/15 px-3 py-1.5 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page {page} / {pages || 1}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="rounded-lg border border-ink/15 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
