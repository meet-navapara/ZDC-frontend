"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import {
  listCatalog,
  type CatalogProduct,
  type CatalogUploader,
} from "@/lib/admin";
import { PageLoader } from "@/components/PageLoader";

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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-12 w-12 text-sm" : size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sage to-sage-dark font-bold tracking-wide text-paper shadow-sm ${dim}`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white/80 p-5 backdrop-blur dark:border-white/10 dark:bg-[#14120f]">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-ink">
        {value}
      </div>
    </div>
  );
}

function relativeTime(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function uploaderTitle(b: CatalogProduct["business"] | CatalogUploader | null) {
  if (!b) return "Unknown uploader";
  if ("businessName" in b || "productCount" in b) {
    const u = b as CatalogUploader;
    return u.businessName || u.ownerName || u.name || u.email || "Unknown";
  }
  return b.name || b.ownerName || b.email || "Unknown";
}

function ProductCard({ p }: { p: CatalogProduct }) {
  const uploader = uploaderTitle(p.business);
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white transition hover:border-sage/40 hover:shadow-[0_12px_40px_-20px_rgba(47,93,80,0.45)] dark:border-white/10 dark:bg-[#14120f]">
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-100 dark:bg-[#1a1712]">
        <div className="absolute inset-0 flex items-center justify-center text-ink-muted">
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
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge status={p.status} />
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent p-3 pt-10">
          <div className="flex items-center gap-2">
            <Avatar name={uploader} size="sm" />
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-paper">
                {uploader}
              </div>
              <div className="truncate text-[10px] text-paper/70">
                {p.business?.email || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="truncate font-display text-lg font-semibold text-ink">
          {p.name}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
          <span className="font-semibold text-ink">
            {money(p.price, p.currency)}
          </span>
          {p.category && (
            <span className="rounded-full bg-ink/5 px-2 py-0.5 capitalize dark:bg-white/5">
              {p.category}
            </span>
          )}
          {p.sku && <span className="font-mono text-[11px]">{p.sku}</span>}
          <span>{p.imageCount} img</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-ink/5 pt-3 text-[11px] text-ink-muted">
          <span>Uploaded {relativeTime(p.createdAt)}</span>
          {p.business?.category && (
            <span className="capitalize">{p.business.category}</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function AdminCatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [uploaders, setUploaders] = useState<CatalogUploader[]>([]);
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
  const [businessId, setBusinessId] = useState("");
  const [view, setView] = useState<"grouped" | "grid">("grouped");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listCatalog({
      page,
      status: status || undefined,
      q: q || undefined,
      business: businessId || undefined,
      limit: view === "grouped" ? 60 : 24,
    })
      .then((r) => {
        setProducts(r.products);
        setUploaders(r.uploaders || []);
        setSummary(r.summary);
        setStatuses(r.statuses);
        setPages(r.pages);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [page, status, q, businessId, view]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { uploader: CatalogUploader | null; items: CatalogProduct[] }
    >();
    for (const p of products) {
      const id = p.business?.id || "unknown";
      if (!map.has(id)) {
        const meta =
          uploaders.find((u) => u.id === id) ||
          (p.business
            ? ({
                id,
                email: p.business.email,
                name: uploaderTitle(p.business),
                ownerName: p.business.ownerName || null,
                businessName: p.business.name,
                category: p.business.category || null,
                productCount: 0,
                activeCount: 0,
                archivedCount: 0,
                lastUploadAt: p.createdAt,
              } as CatalogUploader)
            : null);
        map.set(id, { uploader: meta, items: [] });
      }
      map.get(id)!.items.push(p);
    }
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
  }, [products, uploaders]);

  const selectedUploader = uploaders.find((u) => u.id === businessId) || null;

  if (loading && products.length === 0) {
    return <PageLoader label="Loading catalog…" />;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Catalogue
          </h1>
          <p className="mt-1 text-ink-muted">
            Track every upload by business — see who added what, instantly.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-ink/15 bg-white p-1 dark:border-white/10 dark:bg-[#14120f]">
          <button
            type="button"
            onClick={() => {
              setView("grouped");
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              view === "grouped"
                ? "bg-sage text-paper"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            By uploader
          </button>
          <button
            type="button"
            onClick={() => {
              setView("grid");
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              view === "grid"
                ? "bg-sage text-paper"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            All products
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Products" value={summary.total} />
          <Stat label="Active" value={summary.active} />
          <Stat label="Archived" value={summary.archived} />
          <Stat label="Uploaders" value={summary.businesses} />
        </div>
      )}

      {/* Uploader strip */}
      {uploaders.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Uploaders
            </h2>
            {businessId && (
              <button
                type="button"
                onClick={() => {
                  setBusinessId("");
                  setPage(1);
                }}
                className="text-xs font-semibold text-sage hover:text-sage-dark"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {uploaders.map((u) => {
              const active = businessId === u.id;
              const label = u.businessName || u.name;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setBusinessId(active ? "" : u.id);
                    setPage(1);
                  }}
                  className={`flex min-w-[200px] max-w-[240px] shrink-0 items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-sage bg-sage/10 shadow-sm dark:bg-sage/10"
                      : "border-ink/10 bg-white hover:border-sage/40 dark:border-white/10 dark:bg-[#14120f]"
                  }`}
                >
                  <Avatar name={label} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">
                      {label}
                    </div>
                    <div className="truncate text-[11px] text-ink-muted">
                      {u.ownerName || u.email || "—"}
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-sage-dark">
                      {u.productCount} product{u.productCount === 1 ? "" : "s"}
                      {u.activeCount ? ` · ${u.activeCount} active` : ""}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
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
        <label className="block min-w-[220px] flex-1">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Search
          </span>
          <input
            value={q}
            maxLength={100}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Product, SKU, business, or owner…"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-sage dark:border-white/12 dark:bg-[#14120f] dark:text-[#f4efe7]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Status
          </span>
          <CustomSelect
            size="sm"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { value: "", label: "All" },
              ...statuses.map((s) => ({ value: s, label: s })),
            ]}
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-sage-dark"
        >
          Apply
        </button>
      </form>

      {selectedUploader && (
        <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-sage/25 bg-sage/5 px-4 py-3 dark:bg-sage/10">
          <Avatar name={selectedUploader.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-semibold text-ink">
              {selectedUploader.businessName || selectedUploader.name}
            </div>
            <div className="text-sm text-ink-muted">
              {[selectedUploader.ownerName, selectedUploader.email]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <div className="flex gap-4 text-center text-xs">
            <div>
              <div className="font-display text-xl font-semibold text-ink">
                {selectedUploader.productCount}
              </div>
              <div className="text-ink-muted">products</div>
            </div>
            <div>
              <div className="font-display text-xl font-semibold text-sage-dark">
                {selectedUploader.activeCount}
              </div>
              <div className="text-ink-muted">active</div>
            </div>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-white py-16 text-center text-ink-muted dark:border-white/12 dark:bg-[#14120f]">
          No products match these filters.
        </div>
      ) : view === "grouped" && !businessId ? (
        <div className="mt-8 space-y-10">
          {grouped.map(({ id, uploader, items }) => {
            const title = uploader
              ? uploader.businessName || uploader.name
              : "Unknown uploader";
            return (
              <section key={id}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={title} />
                    <div>
                      <h2 className="font-display text-xl font-semibold text-ink">
                        {title}
                      </h2>
                      <p className="text-xs text-ink-muted">
                        {[uploader?.ownerName, uploader?.email]
                          .filter(Boolean)
                          .join(" · ") || "No contact"}
                        {uploader?.category
                          ? ` · ${uploader.category}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink dark:bg-white/5">
                      {items.length} on this page
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBusinessId(id);
                        setPage(1);
                      }}
                      className="rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold text-ink transition hover:border-sage dark:border-white/12 dark:hover:border-sage"
                    >
                      Focus uploader
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <ProductCard key={p.id} p={p} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-sm text-ink-muted">
        <span>
          {summary?.total ?? 0}{" "}
          {(summary?.total ?? 0) === 1 ? "product" : "products"}
          {selectedUploader
            ? ` · filtered to ${selectedUploader.businessName || selectedUploader.name}`
            : ""}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-ink/15 px-3 py-1.5 disabled:opacity-40 dark:border-white/12"
          >
            Prev
          </button>
          <span>
            Page {page}/{pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="rounded-lg border border-ink/15 px-3 py-1.5 disabled:opacity-40 dark:border-white/12"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
