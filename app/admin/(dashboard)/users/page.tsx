"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import { useSearchParams } from "next/navigation";
import {
  listUsers,
  getUserDetail,
  setUserStatus,
  resetUserPassword,
  deleteUser,
  type AdminUser,
  type UserDetail,
  type UserStatus,
} from "@/lib/admin";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-sage/15 text-sage-dark",
  pending: "bg-amber-100 text-amber-700",
  suspended: "bg-red-100 text-red-700",
};

function StatusBadge({ status }: { status?: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        STATUS_STYLES[status || "active"] || "bg-ink/10 text-ink"
      }`}
    >
      {status || "active"}
    </span>
  );
}

function UsersInner() {
  const params = useSearchParams();
  const [role, setRole] = useState(params.get("role") || "");
  const [status, setStatus] = useState(params.get("status") || "");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listUsers({ role, status, q, page, limit: 20 })
      .then((r) => {
        setRows(r.users);
        setTotal(r.total);
        setPages(r.pages);
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [role, status, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(null), 2500);
  }

  async function changeStatus(u: AdminUser, next: UserStatus) {
    setBusyId(u.id);
    try {
      await setUserStatus(u.id, next);
      flash(`${u.email} → ${next}`);
      load();
    } catch (e) {
      flash(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onReset(u: AdminUser) {
    const pw = window.prompt(`New password for ${u.email} (min 8 chars):`);
    if (!pw) return;
    if (pw.length < 8) {
      flash("Password must be at least 8 characters");
      return;
    }
    setBusyId(u.id);
    try {
      await resetUserPassword(u.id, pw);
      flash("Password reset");
    } catch (e) {
      flash(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(u: AdminUser) {
    if (
      !window.confirm(
        `Delete ${u.email}? This removes their catalog, credits, and try-ons. This cannot be undone.`
      )
    )
      return;
    setBusyId(u.id);
    try {
      await deleteUser(u.id);
      flash("User deleted");
      load();
    } catch (e) {
      flash(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  function openDetail(u: AdminUser) {
    setDetail(null);
    getUserDetail(u.id)
      .then(setDetail)
      .catch((e) => flash(e instanceof Error ? e.message : "Failed to load"));
  }

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  return (
    <div className="mx-auto max-w-6xl">
      {msg && (
        <div className="mt-4 rounded-xl border border-sage/30 bg-sage/10 px-4 py-2.5 text-sm text-sage-dark">
          {msg}
        </div>
      )}

      {/* Filters */}
      <form onSubmit={applyFilters} className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">
            Search
          </label>
          <input
            value={q}
            maxLength={100}
            onChange={(e) => setQ(e.target.value)}
            placeholder="email, name, business…"
            className="w-56 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-sage dark:border-white/12 dark:bg-[#181511] dark:text-[#f4efe7]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">
            Role
          </label>
          <CustomSelect
            size="sm"
            value={role}
            onChange={(v) => { setRole(v); setPage(1); }}
            options={[
              { value: "", label: "All roles" },
              { value: "b2c", label: "Consumer" },
              { value: "b2b", label: "Business" },
              { value: "admin", label: "Admin" },
            ]}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">
            Status
          </label>
          <CustomSelect
            size="sm"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { value: "", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "pending", label: "Pending" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-sage px-4 py-2 text-sm font-semibold text-paper transition hover:bg-sage-dark"
        >
          Apply
        </button>
      </form>

      {/* Table (desktop) */}
      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-ink/10 bg-white dark:border-white/10 dark:bg-[#14120f] md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-paper-100 text-left text-xs uppercase tracking-wider text-ink-muted dark:bg-[#1a1712]">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                  No users match these filters.
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const name =
                  u.business?.name ||
                  [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                  "—";
                const busy = busyId === u.id;
                return (
                  <tr key={u.id} className="align-middle">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(u)}
                        className="text-left font-medium text-ink hover:text-sage-dark dark:hover:text-sage"
                      >
                        {name}
                      </button>
                      <div className="text-xs text-ink-muted">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-ink-muted">
                      {u.role}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {u.role !== "admin" && u.status === "pending" && (
                          <button
                            disabled={busy}
                            onClick={() => changeStatus(u, "active")}
                            className="rounded-lg bg-sage px-2.5 py-1 text-xs font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {u.role !== "admin" && u.status === "active" && (
                          <button
                            disabled={busy}
                            onClick={() => changeStatus(u, "suspended")}
                            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-400/40 dark:hover:bg-red-500/10"
                          >
                            Suspend
                          </button>
                        )}
                        {u.role !== "admin" && u.status === "suspended" && (
                          <button
                            disabled={busy}
                            onClick={() => changeStatus(u, "active")}
                            className="rounded-lg bg-sage px-2.5 py-1 text-xs font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-50"
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          disabled={busy}
                          onClick={() => onReset(u)}
                          className="rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-semibold text-ink transition hover:border-ink/30 disabled:opacity-50 dark:border-white/12 dark:text-[#f4efe7] dark:hover:border-white/25"
                        >
                          Reset PW
                        </button>
                        {u.role !== "admin" && (
                          <button
                            disabled={busy}
                            onClick={() => onDelete(u)}
                            className="rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-semibold text-ink-muted transition hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-white/12 dark:hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="mt-6 space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-ink/10 bg-white px-4 py-10 text-center text-ink-muted dark:border-white/10 dark:bg-[#14120f]">
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white px-4 py-10 text-center text-ink-muted dark:border-white/10 dark:bg-[#14120f]">
            No users match these filters.
          </div>
        ) : (
          rows.map((u) => {
            const name =
              u.business?.name ||
              [u.firstName, u.lastName].filter(Boolean).join(" ") ||
              "—";
            const busy = busyId === u.id;
            return (
              <div
                key={u.id}
                className="rounded-2xl border border-ink/10 bg-white p-4 dark:border-white/10 dark:bg-[#14120f]"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => openDetail(u)}
                    className="min-w-0 text-left"
                  >
                    <div className="truncate font-medium text-ink">{name}</div>
                    <div className="truncate text-xs text-ink-muted">
                      {u.email}
                    </div>
                  </button>
                  <StatusBadge status={u.status} />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                  <span className="capitalize">{u.role}</span>
                  <span>·</span>
                  <span>
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {u.role !== "admin" && u.status === "pending" && (
                    <button
                      disabled={busy}
                      onClick={() => changeStatus(u, "active")}
                      className="rounded-lg bg-sage px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {u.role !== "admin" && u.status === "active" && (
                    <button
                      disabled={busy}
                      onClick={() => changeStatus(u, "suspended")}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-400/40 dark:hover:bg-red-500/10"
                    >
                      Suspend
                    </button>
                  )}
                  {u.role !== "admin" && u.status === "suspended" && (
                    <button
                      disabled={busy}
                      onClick={() => changeStatus(u, "active")}
                      className="rounded-lg bg-sage px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-50"
                    >
                      Reactivate
                    </button>
                  )}
                  <button
                    disabled={busy}
                    onClick={() => onReset(u)}
                    className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-ink/30 disabled:opacity-50 dark:border-white/12 dark:text-[#f4efe7] dark:hover:border-white/25"
                  >
                    Reset PW
                  </button>
                  {u.role !== "admin" && (
                    <button
                      disabled={busy}
                      onClick={() => onDelete(u)}
                      className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-white/12 dark:hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-ink/15 px-3 py-1.5 disabled:opacity-40 dark:border-white/12"
          >
            ← Prev
          </button>
          <span className="text-ink-muted">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-ink/15 px-3 py-1.5 disabled:opacity-40 dark:border-white/12"
          >
            Next →
          </button>
        </div>
      )}

      {/* Detail drawer */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-sm"
          onClick={() => setDetail(null)}
        >
          <div
            className="h-full w-full max-w-md overflow-y-auto bg-paper-100 p-6 shadow-2xl dark:bg-[#14120f]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">
                  {detail.user.business?.name ||
                    [detail.user.firstName, detail.user.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    detail.user.email}
                </h2>
                <p className="text-sm text-ink-muted">{detail.user.email}</p>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="text-ink-muted transition hover:text-ink dark:hover:text-[#f4efe7]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-ink">
                {detail.user.role}
              </span>
              <StatusBadge status={detail.user.status} />
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              {detail.user.phone && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Phone</dt>
                  <dd className="text-ink">{detail.user.phone}</dd>
                </div>
              )}
              {detail.user.business?.category && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Category</dt>
                  <dd className="capitalize text-ink">
                    {detail.user.business.category}
                  </dd>
                </div>
              )}
              {detail.user.business?.address?.city && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Location</dt>
                  <dd className="text-ink">
                    {detail.user.business.address.city}
                    {detail.user.business.address.country
                      ? `, ${detail.user.business.address.country}`
                      : ""}
                  </dd>
                </div>
              )}
              {detail.user.createdAt && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Joined</dt>
                  <dd className="text-ink">
                    {new Date(detail.user.createdAt).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>

            {detail.stats && (
              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Business usage
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-ink/10 bg-white p-3 dark:border-white/10 dark:bg-[#1a1712]">
                    <div className="text-xs text-ink-muted">Credits</div>
                    <div className="font-display text-2xl font-semibold text-ink">
                      {detail.stats.credits}
                    </div>
                  </div>
                  <div className="rounded-xl border border-ink/10 bg-white p-3 dark:border-white/10 dark:bg-[#1a1712]">
                    <div className="text-xs text-ink-muted">Try-ons</div>
                    <div className="font-display text-2xl font-semibold text-ink">
                      {detail.stats.tryons}
                    </div>
                  </div>
                  <div className="rounded-xl border border-ink/10 bg-white p-3 dark:border-white/10 dark:bg-[#1a1712]">
                    <div className="text-xs text-ink-muted">Products</div>
                    <div className="font-display text-2xl font-semibold text-ink">
                      {detail.stats.products}
                    </div>
                  </div>
                  <div className="rounded-xl border border-ink/10 bg-white p-3 dark:border-white/10 dark:bg-[#1a1712]">
                    <div className="text-xs text-ink-muted">Categories</div>
                    <div className="font-display text-2xl font-semibold text-ink">
                      {detail.stats.categories}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ink-muted">Loading…</div>}>
      <UsersInner />
    </Suspense>
  );
}
