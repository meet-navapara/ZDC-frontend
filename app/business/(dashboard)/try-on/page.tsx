"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "@/lib/api";
import { track } from "@/lib/analytics";
import { TryOnShareActions } from "@/components/TryOnShareActions";
import {
  listProducts,
  listCategories,
  createB2BTryon,
  getJob,
  getBalance,
  type Product,
  type Category,
  type B2BJob,
} from "@/lib/b2b";

type Stage = "form" | "working" | "processing" | "done" | "error";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

const LOOK_LINES = [
  "Reading the silhouette…",
  "Draping the fabric…",
  "Matching colour and light…",
  "Adding the finishing look…",
];

function HangerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5a1.75 1.75 0 0 0-1.7 2.16L12 9.5l8 3.2V14H4v-1.3L12 9.5l1.7-2.84A1.75 1.75 0 0 0 12 4.5Z"
      />
      <path strokeLinecap="round" d="M4 18h16" />
    </svg>
  );
}

function formatPrice(p: Product) {
  if (!p.price) return "";
  return `${p.currency} ${p.price.toLocaleString()}`;
}

export default function B2BTryOnPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [productId, setProductId] = useState("");
  const [filter, setFilter] = useState("all");
  const [source, setSource] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("form");
  const [job, setJob] = useState<B2BJob | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [lookLine, setLookLine] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  const preview = useMemo(
    () => (source ? URL.createObjectURL(source) : null),
    [source]
  );
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    Promise.all([
      listProducts({ status: "active" }).catch(() => ({ products: [] })),
      listCategories().catch(() => ({ categories: [] as Category[] })),
      getBalance().catch(() => ({ balance: 0 })),
    ]).then(([p, c, b]) => {
      setProducts(p.products.filter((x) => x.imageUrls.length > 0));
      setCategories(c.categories);
      setBalance(b.balance);
    });
  }, []);

  useEffect(() => {
    if (stage !== "processing" || !job) return;
    const interval = setInterval(async () => {
      try {
        const r = await getJob(job.id);
        if (r.job.status === "completed") {
          setJob(r.job);
          clearInterval(interval);
          window.dispatchEvent(new Event("zdc-credits"));
          setStage("done");
        } else if (r.job.status === "failed") {
          setError("Rendering failed. Your credits were refunded.");
          setStage("error");
          clearInterval(interval);
        }
      } catch {
        // keep polling
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [stage, job]);

  useEffect(() => {
    if (stage !== "processing") {
      setLookLine(0);
      return;
    }
    const tick = window.setInterval(() => {
      setLookLine((i) => (i + 1) % LOOK_LINES.length);
    }, 1800);
    return () => window.clearInterval(tick);
  }, [stage]);

  const selectedProduct = products.find((p) => p.id === productId);
  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name || "";
  const busy = stage === "working";
  const canGenerate = Boolean(source && productId) && !busy;

  const visibleProducts =
    filter === "all"
      ? products
      : products.filter((p) => p.category === filter);

  const filters = [
    { id: "all", label: "All" },
    ...categories
      .filter((c) => products.some((p) => p.category === c.id))
      .map((c) => ({ id: c.id, label: c.name })),
  ];

  function pickFile(f: File | null) {
    setError("");
    if (!f) {
      setSource(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (!ACCEPTED.includes(f.type)) {
      setError("Use a PNG, JPG, or WEBP image.");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError("Image is larger than 10 MB.");
      return;
    }
    setSource(f);
  }

  function scrollCatalog(dir: -1 | 1) {
    catalogRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  }

  function selectProduct(id: string) {
    setError("");
    setProductId((prev) => (prev === id ? "" : id));
  }

  async function submit() {
    setError("");
    if (!source) {
      setError("Upload a customer photo first.");
      return;
    }
    if (!productId) {
      setError("Select a product to try on.");
      return;
    }
    if (balance != null && balance < 1) {
      setError("Not enough credits. You need at least 1 credit.");
      return;
    }
    setStage("working");
    track("b2b_tryon_started", { count: 1 });
    try {
      const fd = new FormData();
      fd.append("productId", productId);
      fd.append("count", "1");
      fd.append("source", source);
      const res = await createB2BTryon(fd);
      setBalance(res.credits);
      setJob(res.job);
      setStage("processing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    }
  }

  function reset() {
    setSource(null);
    setProductId("");
    setJob(null);
    setError("");
    setStage("form");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="mx-auto max-w-5xl">
      {products.length === 0 ? (
        <div className="mt-8 card rounded-2xl px-6 py-12 text-center">
          <p className="text-ink-muted">
            You need at least one product with an image to run a try-on.
          </p>
          <Link
            href="/business/catalog"
            className="mt-4 inline-block rounded-full bg-sage px-6 py-2.5 font-semibold text-paper transition hover:bg-sage-dark"
          >
            Go to Catalog
          </Link>
        </div>
      ) : (
        <>
          {(stage === "form" || stage === "working") && (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
                {/* Your Photo — compact portrait */}
                <section className="flex w-full flex-col rounded-2xl border border-ink/10 bg-white/40 p-3.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] lg:w-[15.5rem]">
                  <h3 className="whitespace-nowrap font-display text-base font-semibold text-ink">
                    Your Photo
                  </h3>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !busy && fileRef.current?.click()}
                    onKeyDown={(e) => {
                      if (!busy && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        fileRef.current?.click();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!busy) setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      if (!busy) pickFile(e.dataTransfer.files?.[0] || null);
                    }}
                    className={`relative mx-auto mt-3 h-[13.5rem] w-[10.125rem] cursor-pointer overflow-hidden rounded-xl border text-center transition sm:h-[14.5rem] sm:w-[10.875rem] ${
                      dragging
                        ? "border-sage"
                        : preview
                        ? "border-ink/10 dark:border-white/10"
                        : "border-dashed border-ink/15 hover:border-sage dark:border-white/15"
                    }`}
                  >
                    {preview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt="Customer photo"
                          className="h-full w-full object-cover"
                        />
                        <div
                          className="absolute inset-x-0 top-0 flex items-center justify-end gap-1 p-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => fileRef.current?.click()}
                            className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-paper backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-50"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => pickFile(null)}
                            className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-paper/90 backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center bg-ink/[0.03] px-3 dark:bg-[#14120f]">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/10 text-lg text-sage">
                          +
                        </div>
                        <div className="mt-2 text-xs font-semibold text-ink">
                          Upload your photo
                        </div>
                        <div className="mt-0.5 text-[10px] leading-snug text-ink-muted">
                          PNG / JPG / WEBP · max 10 MB
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => pickFile(e.target.files?.[0] || null)}
                  />
                </section>

                <section className="flex w-full flex-col rounded-2xl border border-ink/10 bg-white/40 p-3.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] lg:w-[15.5rem]">
                  <h3 className="whitespace-nowrap font-display text-base font-semibold text-ink">
                    Selected Outfit
                  </h3>

                  <div
                    className={`relative mx-auto mt-3 h-[13.5rem] w-[10.125rem] overflow-hidden rounded-xl border text-center sm:h-[14.5rem] sm:w-[10.875rem] ${
                      selectedProduct
                        ? "border-ink/10 dark:border-white/10"
                        : "border-dashed border-ink/15 dark:border-white/15"
                    }`}
                  >
                    {selectedProduct ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={apiUrl(selectedProduct.imageUrls[0])}
                          alt={selectedProduct.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-x-0 top-0 flex items-center justify-end p-1.5">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setProductId("")}
                            className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-paper backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-50"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2.5 pt-8 text-left">
                          <p className="truncate text-xs font-semibold text-paper">
                            {selectedProduct.name}
                          </p>
                          <p className="truncate text-[10px] text-paper/75">
                            {[
                              categoryName(selectedProduct.category),
                              formatPrice(selectedProduct),
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center bg-ink/[0.03] px-3 dark:bg-[#14120f]">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/10 text-sage">
                          <HangerIcon />
                        </div>
                        <div className="mt-2 text-xs font-semibold text-ink">
                          Select an outfit
                        </div>
                        <div className="mt-0.5 text-[10px] leading-snug text-ink-muted">
                          Choose from the catalog below
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Generate — leftover space beside outfit */}
                <section className="flex min-h-[10.5rem] flex-1 flex-col items-center justify-center rounded-2xl border border-ink/10 bg-white/40 px-5 py-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="max-w-[16rem] text-center text-xs leading-relaxed text-ink-muted">
                    Each render uses{" "}
                    <span className="font-semibold text-ink">1 credit</span> and
                    produces 1 image.
                  </p>
                  <button
                    onClick={submit}
                    disabled={!canGenerate}
                    className="mt-4 flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-sage px-6 py-3 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-50"
                  >
                    {busy && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
                    )}
                    {busy ? "Submitting…" : "Generate Try-On"}
                  </button>
                </section>
              </div>

              {/* Horizontal catalog */}
              <section className="mt-6">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink">
                      Choose Your Outfit
                    </h3>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      Select the pieces you want to try on
                    </p>
                  </div>
                </div>

                {filters.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {filters.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilter(f.id)}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          filter === f.id
                            ? "bg-sage text-paper"
                            : "border border-ink/12 text-ink-muted hover:border-ink/25 hover:text-ink dark:border-white/12"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative mt-4">
                  <button
                    type="button"
                    aria-label="Scroll catalog left"
                    onClick={() => scrollCatalog(-1)}
                    className="absolute -left-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-ink/12 bg-paper text-lg text-ink shadow-sm transition hover:border-sage hover:text-sage dark:border-white/15 dark:bg-[#14120f] dark:text-[#f4efe7] sm:flex"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Scroll catalog right"
                    onClick={() => scrollCatalog(1)}
                    className="absolute -right-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-ink/12 bg-paper text-lg text-ink shadow-sm transition hover:border-sage hover:text-sage dark:border-white/15 dark:bg-[#14120f] dark:text-[#f4efe7] sm:flex"
                  >
                    ›
                  </button>

                  <div
                    ref={catalogRef}
                    className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {visibleProducts.length === 0 ? (
                      <p className="py-8 text-sm text-ink-muted">
                        No products in this category.
                      </p>
                    ) : (
                      visibleProducts.map((p) => {
                        const selected = productId === p.id;
                        const cat = categoryName(p.category);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            disabled={busy}
                            onClick={() => selectProduct(p.id)}
                            className={`w-[11.5rem] shrink-0 snap-start overflow-hidden rounded-2xl border text-left transition ${
                              selected
                                ? "border-sage ring-1 ring-sage/40"
                                : "border-ink/10 hover:border-ink/25 dark:border-white/10 dark:hover:border-white/25"
                            } disabled:opacity-60`}
                          >
                            <div className="relative h-36 bg-ink/5 dark:bg-[#14120f]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={apiUrl(p.imageUrls[0])}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                              <span
                                className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold ${
                                  selected
                                    ? "border-sage bg-sage text-paper"
                                    : "border-white/40 bg-black/30 text-transparent"
                                }`}
                              >
                                ✓
                              </span>
                            </div>
                            <div className="px-3 py-2.5">
                              <div className="truncate text-sm font-semibold text-ink">
                                {p.name}
                              </div>
                              {cat && (
                                <div className="truncate text-[11px] text-ink-muted">
                                  {cat}
                                </div>
                              )}
                              {formatPrice(p) && (
                                <div className="mt-0.5 text-[11px] text-ink-muted">
                                  {formatPrice(p)}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>

              {error && (
                <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </>
          )}

          {stage === "processing" && (
            <div className="mx-auto flex max-w-md flex-col items-center pt-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sage">
                Generating look
              </p>
              <h3 className="mt-2 font-display text-3xl font-semibold text-ink">
                Crafting the try-on
              </h3>
              <p className="mt-2 min-h-[1.25rem] text-sm text-ink-muted transition-opacity duration-500">
                {LOOK_LINES[lookLine]}
              </p>

              <div className="relative mt-8 w-[min(100%,18rem)]">
                <div className="absolute -inset-3 rounded-[1.75rem] bg-sage/20 blur-2xl animate-glowPulse" />
                <div className="relative overflow-hidden rounded-[1.5rem] border border-ink/10 bg-[#14120f] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)] dark:border-white/10">
                  <div className="relative aspect-[3/4]">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt="Generating look"
                        className="absolute inset-0 h-full w-full object-cover opacity-80"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-ink/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-sage/10 to-transparent" />
                    <div className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-paper/50 to-transparent animate-scan" />
                    <div className="absolute inset-x-0 bottom-0 overflow-hidden">
                      <div className="h-0.5 w-full bg-sage/20">
                        <div className="h-full w-1/2 bg-sage animate-shimmer" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedProduct && (
                <p className="mt-5 text-xs text-ink-muted">
                  Styling{" "}
                  <span className="font-semibold text-ink">
                    {selectedProduct.name}
                  </span>
                </p>
              )}
            </div>
          )}

          {stage === "done" && job && (
            <div className="flex flex-col items-center">
              <div className="text-center">
                <p className="animate-fadeUp text-[11px] font-semibold uppercase tracking-[0.22em] text-sage">
                  Look ready
                </p>
                <h3
                  className="mt-1 font-display text-2xl font-semibold text-ink animate-fadeUp sm:text-3xl"
                  style={{ animationDelay: "80ms" }}
                >
                  Your try-on is ready
                </h3>
                <span
                  className="mt-2 inline-flex animate-fadeUp items-center gap-2 rounded-full bg-sage/10 px-3 py-1 text-xs font-semibold text-sage-dark"
                  style={{ animationDelay: "140ms" }}
                >
                  ✓ {job.creditsCost} credit{job.creditsCost > 1 ? "s" : ""} used
                  {selectedProduct ? ` · ${selectedProduct.name}` : ""}
                </span>
              </div>

              <div className="mt-5 flex w-fit flex-row items-center justify-center gap-3 sm:gap-5">
                <div className="relative w-[9.5rem] shrink-0 animate-lookReveal sm:w-[16rem]">
                  <div className="absolute -inset-3 rounded-[1.75rem] bg-sage/15 blur-2xl" />
                  <div className="relative overflow-hidden rounded-[1.25rem] border border-ink/10 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.7)] dark:border-white/10">
                    <div className="relative aspect-[3/4] max-h-[58vh]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={apiUrl(job.resultImageUrls[0])}
                        alt="Try-on look"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {job.resultImageUrls[0] && (
                  <div className="w-44 shrink-0 sm:w-56">
                    <TryOnShareActions
                      imageUrl={job.resultImageUrls[0]}
                      filename="zimji-tryon-1.png"
                      onTryAnother={reset}
                      challengePath="/try-on"
                      variant="studio"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {stage === "error" && (
            <div className="mt-16 text-center">
              <div className="mx-auto max-w-md rounded-2xl border border-red-300 bg-red-50 px-6 py-5 text-red-700">
                {error || "Something went wrong."}
              </div>
              <button
                onClick={() => {
                  setError("");
                  setStage("form");
                }}
                className="mt-6 rounded-full bg-sage px-8 py-3 font-semibold text-paper transition hover:bg-sage-dark"
              >
                Back
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
