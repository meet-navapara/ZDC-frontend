"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CustomSelect } from "@/components/CustomSelect";
import { apiUrl, apiGet } from "@/lib/api";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  tryOnFeatureLabel,
  tryOnFeatureShortLabel,
  tryOnFeatureTagline,
  type Category,
  type Product,
  catalogTryOnFeatureOptionsForBusiness,
  defaultTryOnFeatureForBusinessCategory,
  type TryOnFeature,
} from "@/lib/b2b";
import { getUser, getToken, saveAuth } from "@/lib/auth";
import { currencyForCountry } from "@/lib/countries";
import { LIMITS } from "@/lib/limits";
import BulkUploadModal from "@/components/BulkUploadModal";
import { toast } from "@/lib/toast";
import { PageLoader } from "@/components/PageLoader";

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

const fieldClass =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/15 dark:border-white/12 dark:bg-[#1b1713] dark:text-[#f4efe7] dark:focus:ring-sage/25";

const labelClass = "mb-1.5 block text-sm font-medium text-ink-700 dark:text-[#d6cec2]";

type PlatformFeature = {
  title: string;
  desc: string;
  badge?: string;
};

function CatalogPlatformGuide({
  isSalon,
  businessCurrency,
}: {
  isSalon: boolean;
  businessCurrency: string;
}) {
  const features: PlatformFeature[] = isSalon
    ? [
        {
          title: tryOnFeatureLabel("hair"),
          desc: tryOnFeatureTagline("hair"),
          badge: "You upload",
        },
        {
          title: tryOnFeatureLabel("haircolor"),
          desc: `${tryOnFeatureTagline("haircolor")} — no catalog upload needed.`,
          badge: "Built-in",
        },
        {
          title: tryOnFeatureLabel("beard"),
          desc: `${tryOnFeatureTagline("beard")} — pick a look instantly.`,
          badge: "Built-in",
        },
        {
          title: "Live Try-On",
          desc: "Run demos in-store: photo → pick look → generate in seconds.",
        },
        {
          title: "Credits",
          desc: `1 credit = 1 render. Top up in ${businessCurrency} when you need more.`,
        },
        {
          title: "Branches",
          desc: "Add salon locations so staff can manage try-ons per branch.",
        },
      ]
    : [
        {
          title: tryOnFeatureLabel("cloth"),
          desc: tryOnFeatureTagline("cloth"),
          badge: "Your catalog",
        },
        {
          title: "Categories",
          desc: "Group items (shirts, dresses, sets) so staff find products fast.",
        },
        {
          title: "Live Try-On",
          desc: "Customer photo + catalog item → realistic outfit preview.",
        },
        {
          title: "Bulk upload",
          desc: "Add many products with images in one batch.",
        },
        {
          title: "Credits",
          desc: `1 credit = 1 render. Buy packs in ${businessCurrency}.`,
        },
        {
          title: "Branches",
          desc: "Multiple boutique locations under one account.",
        },
      ];

  const steps = [
    {
      n: "1",
      title: "Build catalog",
      desc: isSalon
        ? "Categories + hairstyle photos (colors & beards are automatic)."
        : "Categories + outfit photos with prices.",
    },
    {
      n: "2",
      title: "Open Try-On",
      desc: isSalon
        ? `Choose ${tryOnFeatureShortLabel("hair").toLowerCase()}, ${tryOnFeatureShortLabel("haircolor").toLowerCase()}, or ${tryOnFeatureShortLabel("beard").toLowerCase()} — upload customer photo.`
        : `Pick an outfit and upload the customer photo.`,
    },
    {
      n: "3",
      title: "Generate & share",
      desc: "One credit per image. Show the result or send to the customer.",
    },
  ];

  return (
    <section className="card mb-6 overflow-hidden rounded-2xl border border-sage/20 bg-gradient-to-br from-sage/[0.07] via-white to-paper-100 p-5 dark:from-sage/10 dark:via-[#14120f] dark:to-[#14120f]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-dark">
            How it works
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">
            {isSalon ? "Your salon toolkit" : "Your boutique toolkit"}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
            {isSalon
              ? `Upload hairstyles here. ${tryOnFeatureLabel("haircolor")} and ${tryOnFeatureLabel("beard")} are ready on Try-On — customers pick from built-in libraries.`
              : `Upload outfits here, then run ${tryOnFeatureLabel("cloth").toLowerCase()} with customer photos on the Try-On page.`}
          </p>
        </div>
        <Link
          href="/business/try-on"
          className="shrink-0 rounded-full bg-sage px-4 py-2 text-sm font-semibold text-paper transition hover:bg-sage-dark"
        >
          Open Try-On →
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-ink/8 bg-white/70 p-3.5 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-ink">{f.title}</p>
              {f.badge ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    f.badge === "You upload" || f.badge === "Your catalog"
                      ? "bg-sage/15 text-sage-dark"
                      : "bg-ink/5 text-ink-muted"
                  }`}
                >
                  {f.badge}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 border-t border-ink/10 pt-5 sm:grid-cols-3 dark:border-white/10">
        {steps.map((s) => (
          <div key={s.n} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage/15 text-sm font-bold text-sage-dark">
              {s.n}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{s.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CatalogPage() {
  const [businessCategory, setBusinessCategory] = useState<string>("boutique");
  const [businessCurrency, setBusinessCurrency] = useState(() => {
    const u = getUser();
    return (
      u?.business?.currency ||
      currencyForCountry(u?.business?.address?.country || "") ||
      "KES"
    );
  });
  const featureOptions = useMemo(
    () =>
      catalogTryOnFeatureOptionsForBusiness(businessCategory).map((opt) => ({
        value: opt.id,
        label: opt.label,
      })),
    [businessCategory]
  );
  const defaultFeature = defaultTryOnFeatureForBusinessCategory(businessCategory);
  const isSalon = businessCategory === "salon";

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newCategory, setNewCategory] = useState("");
  const [newCategoryFeature, setNewCategoryFeature] =
    useState<TryOnFeature>("cloth");
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
    const local = getUser();
    if (local?.business?.category) setBusinessCategory(local.business.category);
    if (local?.business?.currency) {
      setBusinessCurrency(local.business.currency);
    } else if (local?.business?.address?.country) {
      setBusinessCurrency(currencyForCountry(local.business.address.country));
    }
    const token = getToken();
    if (!token) return;
    let cancelled = false;
    apiGet<{
      user: {
        business?: {
          category?: "boutique" | "salon" | "other";
          currency?: string;
          address?: { country?: string | null };
        };
      };
    }>("/api/auth/me", token, { cacheTtlMs: 30_000 })
      .then((r) => {
        if (cancelled) return;
        const cat = r.user?.business?.category;
        const cur =
          r.user?.business?.currency ||
          currencyForCountry(r.user?.business?.address?.country || "");
        if (cat) setBusinessCategory(cat);
        if (cur) setBusinessCurrency(cur);
        const current = getUser();
        if (current) {
          saveAuth(token, {
            ...current,
            business: {
              ...current.business,
              ...(cat ? { category: cat } : {}),
              ...(cur ? { currency: cur } : {}),
            },
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setNewCategoryFeature(defaultFeature);
  }, [defaultFeature]);
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

  const modalCategory = categories.find((c) => c.id === form.categoryId);
  const modalTryOnFeature = modalCategory?.tryOnFeature || defaultFeature;

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setError("");
    setAddingCat(true);
    const feature = featureOptions.some((o) => o.value === newCategoryFeature)
      ? newCategoryFeature
      : defaultFeature;
    try {
      const res = await createCategory({
        name: newCategory.trim(),
        tryOnFeature: feature,
      });
      setCategories((cs) => [...cs, res.category]);
      setNewCategory("");
      setNewCategoryFeature(defaultFeature);
      toast.success("Category added");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not add category";
      setError(msg);
      toast.error(msg);
    } finally {
      setAddingCat(false);
    }
  }

  async function setCategoryFeature(id: string, tryOnFeature: TryOnFeature) {
    try {
      const res = await updateCategory(id, { tryOnFeature });
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? res.category : c))
      );
      toast.success("Try-on type updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
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
      toast.success("Category deleted");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not delete category";
      setError(msg);
      toast.error(msg);
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
      toast.success("Category updated");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not rename category";
      setError(msg);
      toast.error(msg);
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
      fd.append("currency", businessCurrency);
      files.forEach((f) => fd.append("images", f));

      if (editing) {
        // Send the kept-image set so removals persist.
        fd.append("imageUrls", JSON.stringify(keptImages));
        const res = await updateProduct(editing.id, fd);
        setProducts((ps) =>
          ps.map((p) => (p.id === editing.id ? res.product : p))
        );
        toast.success("Product updated");
      } else {
        const res = await createProduct(fd);
        setProducts((ps) => [res.product, ...ps]);
        toast.success("Product added");
      }
      setModalOpen(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not save product";
      setModalError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await deleteProduct(p.id);
      setProducts((ps) => ps.filter((x) => x.id !== p.id));
      toast.success("Product deleted");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not delete product";
      setError(msg);
      toast.error(msg);
    }
  }

  if (loading) {
    return <PageLoader label="Loading catalog…" />;
  }

  return (
    <div className="mx-auto max-w-6xl">
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <CatalogPlatformGuide
        isSalon={isSalon}
        businessCurrency={businessCurrency}
      />

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
                className="group inline-flex max-w-full items-center gap-2 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-sm text-ink"
              >
                <button
                  onClick={() => setRenamingCat({ id: c.id, name: c.name })}
                  className="text-left font-medium transition hover:text-sage-dark"
                  title="Rename"
                >
                  {c.name}
                </button>
                {featureOptions.length > 1 ? (
                  <CustomSelect
                    size="xs"
                    className="max-w-[11rem]"
                    value={
                      featureOptions.some((o) => o.value === (c.tryOnFeature || ""))
                        ? c.tryOnFeature || defaultFeature
                        : defaultFeature
                    }
                    onChange={(v) => setCategoryFeature(c.id, v as TryOnFeature)}
                    options={featureOptions}
                    aria-label={`Try-on type for ${c.name}`}
                  />
                ) : (
                  <span className="text-[11px] font-medium text-ink-muted">
                    {tryOnFeatureShortLabel(isSalon ? "hair" : "cloth")}
                  </span>
                )}
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
          {categories.length === 0 && (
            <span className="text-sm text-ink-muted">
              {isSalon
                ? "No hairstyle categories yet — add one below."
                : "No categories yet."}
            </span>
          )}
        </div>
        {categories.length > 0 && (
          <p className="mt-2 text-xs text-ink-muted">
            Click a category name to rename.
            {isSalon
              ? " Upload hairstyle reference photos as products in these categories."
              : ` Boutique categories use ${tryOnFeatureLabel("cloth").toLowerCase()}.`}
          </p>
        )}

        {categories.length < MAX_CATEGORIES && (
          <form
            onSubmit={addCategory}
            className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <input
              maxLength={LIMITS.categoryName}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={
                isSalon ? "New hairstyle category (e.g. Braids)" : "New category name"
              }
              className="w-full max-w-xs rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-sage"
            />
            {featureOptions.length > 1 ? (
              <CustomSelect
                className="w-full max-w-xs sm:w-auto"
                value={newCategoryFeature}
                onChange={(v) => setNewCategoryFeature(v as TryOnFeature)}
                options={featureOptions}
                aria-label="Try-on type for new category"
              />
            ) : null}
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
      {visibleProducts.length === 0 ? (
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
                  {p.currency}{" "}
                  {Number(p.price).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
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
            className="my-auto max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink/10 bg-paper-100 shadow-2xl dark:border-white/10 dark:bg-[#14120f]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-ink/10 px-6 py-5 dark:border-white/10">
              <div>
                <h3 className="font-display text-xl font-semibold text-ink">
                  {editing ? "Edit product" : "Add product"}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {isSalon
                    ? "Hairstyle catalog item — shown on Try-On."
                    : "Outfit catalog item — shown on Try-On."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setModalOpen(false)}
                disabled={saving}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/10 text-lg text-ink-muted transition hover:border-ink/20 hover:text-ink disabled:opacity-50 dark:border-white/10"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={saveProduct} className="space-y-5 px-6 py-5">
              {modalError && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {modalError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="product-name" className={labelClass}>
                    Product name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="product-name"
                    maxLength={LIMITS.productName}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Box braids, Linen shirt"
                    className={fieldClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="product-sku" className={labelClass}>
                    SKU
                  </label>
                  <input
                    id="product-sku"
                    maxLength={LIMITS.sku}
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="Optional code"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="product-category" className={labelClass}>
                    Category
                  </label>
                  <CustomSelect
                    value={form.categoryId}
                    onChange={(v) => setForm({ ...form, categoryId: v })}
                    options={[
                      { value: "", label: "Uncategorized" },
                      ...categories.map((c) => ({
                        value: c.id,
                        label: c.name,
                      })),
                    ]}
                    aria-label="Product category"
                  />
                </div>
              </div>

              {/* Image */}
              <div className="rounded-xl border border-ink/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mb-3 flex items-center justify-between">
                  <label className={labelClass.replace("mb-1.5 ", "")}>
                    Photo <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs font-medium text-ink-muted">
                    {keptImages.length + files.length}/1
                  </span>
                </div>
                <div className="flex flex-wrap items-start gap-3">
                  {keptImages.map((url) => (
                    <div
                      key={url}
                      className="relative h-28 w-24 overflow-hidden rounded-xl border border-ink/10 shadow-sm dark:border-white/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={apiUrl(url)}
                        alt="Product"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setKeptImages((imgs) => imgs.filter((u) => u !== url))
                        }
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/75 text-sm text-paper"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {previews.map((p, i) => (
                    <div
                      key={p.url}
                      className="relative h-28 w-24 overflow-hidden rounded-xl border border-sage shadow-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFiles((fs) => fs.filter((_, idx) => idx !== i))
                        }
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/75 text-sm text-paper"
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
                      className="flex h-28 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink/15 text-xs font-medium text-ink-muted transition hover:border-sage hover:text-sage dark:border-white/12"
                    >
                      <span className="text-lg leading-none">+</span>
                      Upload
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
                {modalTryOnFeature === "hair" && (
                  <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                    Clear hairstyle reference — customers try this on their selfie.
                  </p>
                )}
                {modalTryOnFeature === "cloth" && (
                  <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                    Clear garment photo (flat lay or on model).
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="product-price" className={labelClass}>
                  Price
                </label>
                <div className="relative max-w-xs">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">
                    {businessCurrency}
                  </span>
                  <input
                    id="product-price"
                    type="number"
                    min={0}
                    step={1}
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    placeholder="0"
                    className={`${fieldClass} pl-[4.25rem] tabular-nums`}
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-muted">
                  Saved in {businessCurrency}. Update currency in Settings if
                  needed.
                </p>
              </div>

              {editing && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <input
                    type="checkbox"
                    checked={form.status === "archived"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.checked ? "archived" : "active",
                      })
                    }
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">
                      Archive product
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      Hidden from Try-On but kept in your catalog.
                    </span>
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-2 border-t border-ink/10 pt-4 dark:border-white/10">
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
                  {saving
                    ? "Saving…"
                    : editing
                      ? "Save changes"
                      : "Create product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BulkUploadModal
        open={bulkOpen}
        categories={categories}
        currency={businessCurrency}
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
