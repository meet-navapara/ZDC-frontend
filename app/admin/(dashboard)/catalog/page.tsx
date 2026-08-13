"use client";

import { useCallback, useEffect, useState } from "react";
import { listCatalog, type CatalogProduct } from "@/lib/admin";

const STATUS_TONE: Record<string, string> = {
  active: "bg-sage/10 text-sage-dark border-sage/30",
  archived: "bg-ink/5 text-ink-muted border-ink/15",
};

function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] || "bg-ink/5 text-ink border-ink/15";
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${tone}`}
    >
      {status}
    </span>
  );
}

function money(amount: number, currency = "KES") {
  return `${currency} ${amount.toLocaleString()}`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-ink">
        {value}
      </div>
    </div>
  );
}

export default function AdminCatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    active: number;
    archived: number;
    businesses: number;
  } | null>(null);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listCatalog({ page, status: status || undefined, q: q || undefined })
      .then((r) => {
        setProducts(r.products);
        setSummary(r.summary);
        setStatuses(r.statuses);
        setPages(r.pages);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [page, status, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl">
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Products" value={summary.total} />
          <Stat label="Active" value={summary.active} />
          <Stat label="Archived" value={summary.archived} />
          <Stat label="Businesses" value={summary.businesses} />
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
            placeholder="Product name or SKU…"
            className="w-56 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-sage"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Status
          </span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm capitalize text-ink outline-none focus:border-sage"
          >
            <option value="">All</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
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

      {/* Grid */}
      {loading ? (
        <div className="mt-10 text-center text-ink-muted">Loading…</div>
      ) : products.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-ink/10 bg-white py-16 text-center text-ink-muted">
          No products match these filters.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex gap-4 rounded-2xl border border-ink/10 bg-white p-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-paper-100">
                <div className="flex h-full w-full items-center justify-center text-ink-muted">
                  ▤
                </div>
                {p.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.thumbnail}
                    alt={p.name}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate font-medium text-ink">{p.name}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-0.5 truncate text-sm text-ink-muted">
                  {p.business?.name || p.business?.email || "Unknown business"}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                  <span className="font-medium text-ink">
                    {money(p.price, p.currency)}
                  </span>
                  {p.category && <span>· {p.category}</span>}
                  {p.sku && <span>· {p.sku}</span>}
                  <span>· {p.imageCount} img</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-sm text-ink-muted">
        <span>
          {summary?.total ?? 0}{" "}
          {(summary?.total ?? 0) === 1 ? "product" : "products"}
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
