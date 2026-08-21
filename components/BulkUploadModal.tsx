"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import {
  createProductsBulk,
  type Category,
  type Product,
} from "@/lib/b2b";
import { LIMITS } from "@/lib/limits";
import { toast } from "@/lib/toast";

export const MAX_BULK_PRODUCTS = 30;

type BulkRow = {
  key: string;
  file: File;
  name: string;
  sku: string;
  price: string;
  categoryId: string;
};

type Props = {
  open: boolean;
  categories: Category[];
  currency?: string;
  onClose: () => void;
  onCreated: (products: Product[]) => void;
};

function nameFromFilename(filename: string) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LIMITS.productName);
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function BulkUploadModal({
  open,
  categories,
  currency = "KES",
  onClose,
  onCreated,
}: Props) {
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [defaults, setDefaults] = useState({
    categoryId: "",
    price: "",
  });
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [resultNote, setResultNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(
    () => rows.map((r) => ({ key: r.key, url: URL.createObjectURL(r.file) })),
    [rows]
  );

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  useEffect(() => {
    if (!open) {
      setRows([]);
      setDefaults({ categoryId: "", price: "" });
      setError("");
      setResultNote("");
      setProgress(0);
      setSaving(false);
      setDragOver(false);
    }
  }, [open]);

  if (!open) return null;

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const incoming = Array.from(list).filter((f) =>
      /^image\/(png|jpe?g|webp)$/i.test(f.type)
    );
    if (!incoming.length) {
      setError("Only PNG, JPG, or WEBP images are allowed.");
      return;
    }
    setError("");
    setRows((prev) => {
      const room = Math.max(0, MAX_BULK_PRODUCTS - prev.length);
      const slice = incoming.slice(0, room);
      const next = slice.map((file) => ({
        key: uid(),
        file,
        name: nameFromFilename(file.name) || "Untitled product",
        sku: "",
        price: defaults.price,
        categoryId: defaults.categoryId,
      }));
      return [...prev, ...next];
    });
  }

  function updateRow(key: string, patch: Partial<BulkRow>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setRows((rs) => rs.filter((r) => r.key !== key));
  }

  function applyDefaultsToAll() {
    setRows((rs) =>
      rs.map((r) => ({
        ...r,
        price: defaults.price || r.price,
        categoryId: defaults.categoryId || r.categoryId,
      }))
    );
  }

  async function submit() {
    setError("");
    setResultNote("");
    if (!rows.length) {
      setError("Add at least one product image.");
      return;
    }
    const missing = rows.findIndex((r) => !r.name.trim());
    if (missing >= 0) {
      setError(`Row ${missing + 1} needs a product name.`);
      return;
    }

    setSaving(true);
    setProgress(8);
    const tick = window.setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.random() * 8));
    }, 400);

    try {
      const items = rows.map((r) => ({
        name: r.name.trim(),
        sku: r.sku.trim() || undefined,
        price: r.price ? Number(r.price) : undefined,
        categoryId: r.categoryId || "",
        currency,
      }));
      const fd = new FormData();
      fd.append("items", JSON.stringify(items));
      rows.forEach((r) => fd.append("images", r.file));

      const res = await createProductsBulk(fd);
      setProgress(100);
      onCreated(res.created);

      if (res.summary.failed > 0) {
        const note = `Created ${res.summary.success} of ${res.summary.total}. ${res.summary.failed} failed.`;
        setResultNote(note);
        toast.error(note);
        // Keep failed rows for retry
        const failedIdx = new Set(res.errors.map((e) => e.index));
        setRows((rs) => rs.filter((_, i) => failedIdx.has(i)));
        setError(
          res.errors
            .slice(0, 3)
            .map((e) => `#${e.index + 1}: ${e.error}`)
            .join(" · ")
        );
      } else {
        toast.success(
          `Uploaded ${res.summary.success} product${
            res.summary.success === 1 ? "" : "s"
          }`
        );
        onClose();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bulk upload failed";
      setError(msg);
      toast.error(msg);
    } finally {
      window.clearInterval(tick);
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={() => !saving && onClose()}
    >
      <div
        className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-ink/10 bg-paper-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-ink/10 bg-gradient-to-br from-sage/10 via-paper-100 to-paper-100 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-semibold text-ink">
                Bulk upload
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                Drop up to {MAX_BULK_PRODUCTS} images — each becomes a product.
                Edit names & prices before publishing.
              </p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-full border border-ink/15 px-3 py-1 text-sm text-ink-muted transition hover:text-ink"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[75vh] space-y-5 overflow-y-auto px-6 py-5">
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {resultNote && (
            <div className="rounded-xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-sage-dark">
              {resultNote}
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`relative overflow-hidden rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
              dragOver
                ? "border-sage bg-sage/10"
                : "border-ink/15 bg-white hover:border-sage/50"
            }`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(47,93,80,0.08),transparent_55%)]" />
            <p className="relative font-display text-lg font-semibold text-ink">
              Drag & drop product photos
            </p>
            <p className="relative mt-1 text-sm text-ink-muted">
              PNG, JPG, or WEBP · {rows.length}/{MAX_BULK_PRODUCTS} selected
            </p>
            <button
              type="button"
              disabled={saving || rows.length >= MAX_BULK_PRODUCTS}
              onClick={() => inputRef.current?.click()}
              className="relative mt-4 rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-50"
            >
              Browse files
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* Shared defaults */}
          <div className="rounded-2xl border border-ink/10 bg-white p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Apply to all
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Set a shared category & price, then push to every row.
                </p>
              </div>
              <button
                type="button"
                disabled={!rows.length || saving}
                onClick={applyDefaultsToAll}
                className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition hover:border-sage disabled:opacity-40"
              >
                Apply defaults
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                  Category
                </span>
                <CustomSelect
                  value={defaults.categoryId}
                  disabled={saving}
                  onChange={(v) => setDefaults((d) => ({ ...d, categoryId: v }))}
                  options={[
                    { value: "", label: "Uncategorized" },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                  Price ({currency})
                </span>
                <input
                  type="number"
                  min={0}
                  disabled={saving}
                  value={defaults.price}
                  onChange={(e) =>
                    setDefaults((d) => ({ ...d, price: e.target.value }))
                  }
                  placeholder="0"
                  className="w-full rounded-xl border border-ink/15 bg-paper-100 px-3 py-2.5 text-sm text-ink outline-none focus:border-sage"
                />
              </label>
            </div>
          </div>

          {/* Rows */}
          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-ink">
                  {rows.length} product{rows.length === 1 ? "" : "s"} ready
                </h4>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setRows([])}
                  className="text-xs font-semibold text-ink-muted transition hover:text-red-600"
                >
                  Clear all
                </button>
              </div>
              {rows.map((r, i) => {
                const preview = previews.find((p) => p.key === r.key)?.url;
                return (
                  <div
                    key={r.key}
                    className="flex gap-3 rounded-2xl border border-ink/10 bg-white p-3 transition hover:border-sage/30"
                  >
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-ink/5">
                      {preview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={preview}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                      <span className="absolute left-1 top-1 rounded bg-ink/60 px-1.5 text-[10px] font-semibold text-paper">
                        {i + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        maxLength={LIMITS.productName}
                        disabled={saving}
                        value={r.name}
                        onChange={(e) =>
                          updateRow(r.key, { name: e.target.value })
                        }
                        placeholder="Product name"
                        className="w-full rounded-lg border border-ink/15 bg-paper-100 px-3 py-2 text-sm font-medium text-ink outline-none focus:border-sage"
                      />
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <input
                          maxLength={LIMITS.sku}
                          disabled={saving}
                          value={r.sku}
                          onChange={(e) =>
                            updateRow(r.key, { sku: e.target.value })
                          }
                          placeholder="SKU"
                          className="rounded-lg border border-ink/15 bg-paper-100 px-3 py-2 text-xs text-ink outline-none focus:border-sage"
                        />
                        <input
                          type="number"
                          min={0}
                          disabled={saving}
                          value={r.price}
                          onChange={(e) =>
                            updateRow(r.key, { price: e.target.value })
                          }
                          placeholder={`Price (${currency})`}
                          className="rounded-lg border border-ink/15 bg-paper-100 px-3 py-2 text-xs text-ink outline-none focus:border-sage"
                        />
                        <CustomSelect
                          size="sm"
                          disabled={saving}
                          value={r.categoryId}
                          onChange={(v) => updateRow(r.key, { categoryId: v })}
                          className="col-span-2 sm:col-span-1"
                          options={[
                            { value: "", label: "Uncategorized" },
                            ...categories.map((c) => ({ value: c.id, label: c.name })),
                          ]}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => removeRow(r.key)}
                      className="self-start rounded-lg px-2 py-1 text-sm text-ink-muted transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {saving && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-ink-muted">
                <span>Uploading & creating products…</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-sage transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 bg-white/60 px-6 py-4">
          <p className="text-xs text-ink-muted">
            Tip: name files like <span className="font-mono">navy-blazer.jpg</span>{" "}
            — we prefill the product title.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !rows.length}
              onClick={submit}
              className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-50"
            >
              {saving
                ? "Publishing…"
                : `Publish ${rows.length || ""} product${rows.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
