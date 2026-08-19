"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import { apiUrl } from "@/lib/api";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Category,
  type Product,
} from "@/lib/b2b";
import { LIMITS } from "@/lib/limits";
import BulkUploadModal from "@/components/BulkUploadModal";

const MAX_CATEGORIES = 10;

type ProductForm = {
  name: string;
  sku: string;
  price: string;
  categoryId: string;
  status: "active" | "archived";
};

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  price: "",
  categoryId: "",
  status: "active",
};

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newCategory, setNewCategory] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  // Inline category rename
  const [renamingCat, setRenamingCat] = useState<{ id: string; name: string } | null>(
    null
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [keptImages, setKeptImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(
    () => files.map((f) => ({ url: URL.createObjectURL(f), name: f.name })),
    [files]
  );
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  async function load() {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([listCategories(), listProducts()]);
      setCategories(c.categories);
      setProducts(p.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name || "Uncategorized";

  const visibleProducts =
    filter === "all"
      ? products
      : products.filter((p) => (p.category || "none") === filter);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setError("");
    setAddingCat(true);
    try {
      const res = await createCategory({ name: newCategory.trim() });
      setCategories((cs) => [...cs, res.category]);
      setNewCategory("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add category");
    } finally {
      setAddingCat(false);
    }
  }

  async function removeCategory(id: string) {
    if (!confirm("Delete this category? Products will become uncategorized.")) return;
    try {
      await deleteCategory(id);
      setCategories((cs) => cs.filter((c) => c.id !== id));
      setProducts((ps) =>
        ps.map((p) => (p.category === id ? { ...p, category: null } : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete category");
    }
  }

  async function saveRename() {
    if (!renamingCat || !renamingCat.name.trim()) {
      setRenamingCat(null);
      return;
    }
    const { id, name } = renamingCat;
    try {
      const res = await updateCategory(id, { name: name.trim() });
      setCategories((cs) => cs.map((c) => (c.id === id ? res.category : c)));
      setRenamingCat(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename category");
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFiles([]);
    setKeptImages([]);
    setModalError("");
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku || "",
      price: String(p.price ?? ""),
      categoryId: p.category || "",
      status: p.status,
    });
    setFiles([]);
    setKeptImages(p.imageUrls);
    setModalError("");
    setModalOpen(true);
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    setFiles((prev) => {
      const room = Math.max(0, 1 - keptImages.length - prev.length);
      return [...prev, ...incoming.slice(0, room)];
    });
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setModalError("");
    if (!form.name.trim()) {
      setModalError("Product name is required.");
      return;
    }
    const totalImages = keptImages.length + files.length;
    if (totalImages === 0) {
      setModalError("Please add at least one product image.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("sku", form.sku);
      if (form.price) fd.append("price", form.price);
      fd.append("categoryId", form.categoryId);
      fd.append("status", form.status);
      files.forEach((f) => fd.append("images", f));

      if (editing) {
        // Send the kept-image set so removals persist.
        fd.append("imageUrls", JSON.stringify(keptImages));
        const res = await updateProduct(editing.id, fd);
        setProducts((ps) =>
          ps.map((p) => (p.id === editing.id ? res.product : p))
        );
      } else {
        const res = await createProduct(fd);
        setProducts((ps) => [res.product, ...ps]);
      }
      setModalOpen(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await deleteProduct(p.id);
      setProducts((ps) => ps.filter((x) => x.id !== p.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete product");
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Categories */}
      <section className="card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">
            Categories
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-muted">
              {categories.length}/{MAX_CATEGORIES}
            </span>
            <button
              onClick={() => setBulkOpen(true)}
              className="rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-sage"
            >
              Bulk upload
            </button>
            <button
              onClick={openCreate}
              className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-sage-dark"
            >
              + Add product
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) =>
            renamingCat?.id === c.id ? (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded-full border border-sage bg-white px-2 py-1 text-sm"
              >
                <input
                  autoFocus
                  maxLength={LIMITS.categoryName}
                  value={renamingCat.name}
                  onChange={(e) =>
                    setRenamingCat({ id: c.id, name: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename();
                    if (e.key === "Escape") setRenamingCat(null);
                  }}
                  className="w-28 bg-transparent px-1 text-ink outline-none"
                />
                <button
                  onClick={saveRename}
                  className="text-sage-dark transition hover:text-sage"
                  aria-label="Save name"
                >
                  ✓
                </button>
                <button
                  onClick={() => setRenamingCat(null)}
                  className="text-ink-muted transition hover:text-ink"
                  aria-label="Cancel rename"
                >
                  ×
                </button>
              </span>
            ) : (
              <span
                key={c.id}
                className="group inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-sm text-ink"
              >
                <button
                  onClick={() => setRenamingCat({ id: c.id, name: c.name })}
                  className="transition hover:text-sage-dark"
                  title="Rename"
                >
                  {c.name}
                </button>
                <button
                  onClick={() => removeCategory(c.id)}
                  className="text-ink-muted transition hover:text-red-600"
                  aria-label={`Delete ${c.name}`}
                >
                  ×
                </button>
              </span>
            )
          )}
          {categories.length === 0 && !loading && (
            <span className="text-sm text-ink-muted">No categories yet.</span>
          )}
        </div>
        {categories.length > 0 && (
          <p className="mt-2 text-xs text-ink-muted">
            Click a category name to rename it.
          </p>
        )}

        {categories.length < MAX_CATEGORIES && (
          <form onSubmit={addCategory} className="mt-4 flex gap-2">
            <input
              maxLength={LIMITS.categoryName}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
              className="w-full max-w-xs rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-sage"
            />
            <button
              type="submit"
              disabled={addingCat || !newCategory.trim()}
              className="rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-sage disabled:opacity-50"
            >
              {addingCat ? "Adding…" : "Add"}
            </button>
          </form>
        )}
      </section>

      {/* Filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          All ({products.length})
        </FilterChip>
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            active={filter === c.id}
            onClick={() => setFilter(c.id)}
          >
            {c.name} ({products.filter((p) => p.category === c.id).length})
          </FilterChip>
        ))}
      </div>

      {/* Products */}
      {loading ? (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-ink/5" />
          ))}
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="mt-6 card rounded-2xl px-6 py-12 text-center">
          <p className="text-ink-muted">
            No products here yet. Use{" "}
            <span className="font-semibold text-ink">Bulk upload</span> for many
            items, or{" "}
            <span className="font-semibold text-ink">Add product</span> for one.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((p) => (
            <div
              key={p.id}
              className="card group flex flex-col overflow-hidden rounded-2xl p-4"
            >
              {/* Image (square, like the reference) */}
              <div className="relative aspect-square overflow-hidden rounded-xl bg-ink/5">
                <div className="flex h-full items-center justify-center text-sm text-ink-muted">
                  No image
                </div>
                {p.imageUrls[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={apiUrl(p.imageUrls[0])}
                    alt={p.name}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                {p.status === "archived" && (
                  <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-semibold text-paper">
                    Archived
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col px-1 pt-4">
                <h3
                  className="line-clamp-2 text-lg font-semibold leading-snug text-ink"
                  title={p.name}
                >
                  {p.name}
                </h3>
                <div className="mt-1 truncate text-xs capitalize text-ink-muted">
                  {categoryName(p.category)}
                </div>
                <div className="mt-2 text-xl font-bold text-ink">
                  {p.currency} {p.price}
                </div>

                <button
                  onClick={() => openEdit(p)}
                  className="mt-4 w-full rounded-lg bg-sage py-3 text-sm font-semibold uppercase tracking-[0.12em] text-paper transition hover:bg-sage-dark"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeProduct(p)}
                  className="mt-2 w-full rounded-lg py-2 text-xs font-semibold text-ink-muted transition hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => !saving && setModalOpen(false)}
        >
          <div
            className="my-auto max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink/10 bg-paper-100 p-6 shadow-2xl dark:border-white/10 dark:bg-[#14120f]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-semibold text-ink">
              {editing ? "Edit product" : "Add product"}
            </h3>

            <form onSubmit={saveProduct} className="mt-4 space-y-4">
              {modalError && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {modalError}
                </div>
              )}

              <div className="space-y-3">
                <input
                  maxLength={LIMITS.productName}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Product name"
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-sage dark:border-white/12 dark:bg-[#1b1713] dark:text-[#f4efe7]"
                />
                <input
                  maxLength={LIMITS.sku}
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="SKU (optional)"
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-sage dark:border-white/12 dark:bg-[#1b1713] dark:text-[#f4efe7]"
                />
              </div>

              {/* Images (up to 5) */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-ink-700 dark:text-[#d6cec2]">
                    Image
                  </label>
                  <span className="text-xs text-ink-muted">
                    {keptImages.length + files.length}/1
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keptImages.map((url) => (
                    <div
                      key={url}
                      className="relative h-20 w-16 overflow-hidden rounded-lg border border-ink/10 dark:border-white/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={apiUrl(url)}
                        alt="product"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setKeptImages((imgs) => imgs.filter((u) => u !== url))
                        }
                        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs text-paper"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {previews.map((p, i) => (
                    <div
                      key={p.url}
                      className="relative h-20 w-16 overflow-hidden rounded-lg border border-sage dark:bg-[#1b1713]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={p.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFiles((fs) => fs.filter((_, idx) => idx !== i))
                        }
                        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs text-paper"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {keptImages.length + files.length < 1 && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex h-20 w-16 flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink/15 text-xs text-ink-muted transition hover:border-sage dark:border-white/12 dark:text-[#b1a99c]"
                    >
                      + Add
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="Price"
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-sage dark:border-white/12 dark:bg-[#1b1713] dark:text-[#f4efe7]"
                />
                <CustomSelect
                  value={form.categoryId}
                  onChange={(v) => setForm({ ...form, categoryId: v })}
                  options={[
                    { value: "", label: "Uncategorized" },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>

              {editing && (
                <label className="flex items-center gap-2 text-sm text-ink-muted dark:text-[#b1a99c]">
                  <input
                    type="checkbox"
                    checked={form.status === "archived"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.checked ? "archived" : "active",
                      })
                    }
                  />
                  Archived (hidden from try-on)
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 dark:border-white/15 dark:text-[#f4efe7] dark:hover:border-white/25"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
                >
                  {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BulkUploadModal
        open={bulkOpen}
        categories={categories}
        currency={products[0]?.currency || "KES"}
        onClose={() => setBulkOpen(false)}
        onCreated={(created) => {
          if (created.length) {
            setProducts((ps) => [...created, ...ps]);
          }
        }}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-sage text-paper"
          : "border border-ink/15 bg-white text-ink-muted hover:border-ink/30 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
