"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "@/lib/api";
import { track } from "@/lib/analytics";
import { TryOnResultReady } from "@/components/TryOnResultReady";
import {
  isPhotoGuideDismissed,
  PhotoGuideModal,
} from "@/components/LandingPhotoGuide";
import {
  listProducts,
  listCategories,
  createB2BTryon,
  getJob,
  getBalance,
  tryOnFeatureLabel,
  tryOnFeatureOptionsForBusiness,
  tryOnFeatureShortLabel,
  tryOnFeatureTagline,
  defaultTryOnFeatureForBusinessCategory,
  type TryOnFeature,
  type Product,
  type Category,
  type B2BJob,
} from "@/lib/b2b";
import { getUser } from "@/lib/auth";
import { listPerfectCorpOptions } from "@/lib/b2c";
import {
  BeardStylePicker,
  HairColorPicker,
  type BeardTemplateOption,
  type HairColorOption,
} from "@/components/PerfectCorpPickers";
import { toast } from "@/lib/toast";
import {
  friendlyTryOnError,
  readImageDimensions,
  tryOnImageSizeMessage,
  tryOnImageTooSmall,
} from "@/lib/tryOnImage";

type Stage = "form" | "working" | "processing" | "done" | "error";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

const LOOK_LINES_BY_FEATURE: Record<TryOnFeature, string[]> = {
  cloth: [
    "Reading the silhouette…",
    "Draping the fabric…",
    "Matching colour and light…",
    "Adding the finishing look…",
  ],
  hair: [
    "Mapping your features…",
    "Blending the hairstyle…",
    "Matching tone and texture…",
    "Finishing the look…",
  ],
  haircolor: [
    "Detecting hair regions…",
    "Blending the new shade…",
    "Balancing highlights…",
    "Polishing the result…",
  ],
  beard: [
    "Mapping facial structure…",
    "Applying the beard style…",
    "Blending edges naturally…",
    "Finishing the look…",
  ],
};

function getB2bTryOnCopy(feature: TryOnFeature) {
  const short = tryOnFeatureShortLabel(feature).toLowerCase();
  switch (feature) {
    case "hair":
      return {
        selectedTitle: `Selected ${short}`,
        selectedEmpty: `Select a ${short}`,
        catalogTitle: tryOnFeatureLabel(feature),
        catalogDesc: "Styles you uploaded in Catalog",
        lookLines: LOOK_LINES_BY_FEATURE.hair,
      };
    case "haircolor":
      return {
        selectedTitle: `Selected ${short}`,
        selectedEmpty: "Pick a shade",
        catalogTitle: tryOnFeatureLabel(feature),
        catalogDesc: "Built-in Perfect Corp shades — no catalog upload needed",
        lookLines: LOOK_LINES_BY_FEATURE.haircolor,
      };
    case "beard":
      return {
        selectedTitle: `Selected ${short}`,
        selectedEmpty: "Pick a beard style",
        catalogTitle: tryOnFeatureLabel(feature),
        catalogDesc: "Built-in Perfect Corp styles — no catalog upload needed",
        lookLines: LOOK_LINES_BY_FEATURE.beard,
      };
    default:
      return {
        selectedTitle: `Selected ${short}`,
        selectedEmpty: `Select an ${short}`,
        catalogTitle: tryOnFeatureLabel(feature),
        catalogDesc: tryOnFeatureTagline(feature),
        lookLines: LOOK_LINES_BY_FEATURE.cloth,
      };
  }
}

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
  const businessCategory = getUser()?.business?.category || "boutique";
  const isSalon = businessCategory === "salon";
  const modeOptions = useMemo(
    () => tryOnFeatureOptionsForBusiness(businessCategory),
    [businessCategory]
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [productId, setProductId] = useState("");
  const [filter, setFilter] = useState("all");
  const [sessionFeature, setSessionFeature] = useState<TryOnFeature>(() =>
    defaultTryOnFeatureForBusinessCategory(businessCategory)
  );
  const [hairColorOptions, setHairColorOptions] = useState<HairColorOption[]>(
    []
  );
  const [beardTemplates, setBeardTemplates] = useState<BeardTemplateOption[]>(
    []
  );
  const [hairColorPreset, setHairColorPreset] = useState("");
  const [beardTemplateId, setBeardTemplateId] = useState("");
  const [source, setSource] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("form");
  const [job, setJob] = useState<B2BJob | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [lookLine, setLookLine] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
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
    let cancelled = false;
    Promise.all([
      listProducts({ status: "active" }).catch(() => ({ products: [] })),
      listCategories().catch(() => ({ categories: [] as Category[] })),
      getBalance().catch(() => ({ balance: 0 })),
    ]).then(([p, c, b]) => {
      if (cancelled) return;
      setProducts(p.products.filter((x) => x.imageUrls.length > 0));
      setCategories(c.categories);
      setBalance(b.balance);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isSalon) return;
    let cancelled = false;
    listPerfectCorpOptions()
      .then((r) => {
        if (cancelled) return;
        setHairColorOptions(r.hairColors || []);
        setBeardTemplates(r.beardTemplates || []);
        setHairColorPreset(
          (prev) =>
            prev ||
            r.defaultHairColorPreset ||
            r.hairColors?.[0]?.name ||
            "Honey Blonde"
        );
        setBeardTemplateId(
          (prev) =>
            prev ||
            r.defaultBeardTemplateId ||
            r.beardTemplates?.[0]?.id ||
            "all_anchor"
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSalon]);

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
          toast.success("Try-on complete");
        } else if (r.job.status === "failed") {
          const msg = friendlyTryOnError(r.job.error);
          setError(`${msg} Your credits were refunded.`);
          toast.error(msg);
          setStage("error");
          clearInterval(interval);
        }
      } catch {
        // keep polling
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [stage, job]);

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedCategory = selectedProduct?.category
    ? categories.find((c) => c.id === selectedProduct.category)
    : null;

  // Boutique: feature from product category. Salon: explicit mode tab.
  const tryOnFeature: TryOnFeature = isSalon
    ? sessionFeature
    : selectedCategory?.tryOnFeature || "cloth";
  const needsCatalogProduct =
    tryOnFeature === "cloth" || tryOnFeature === "hair";
  const copy = useMemo(
    () => getB2bTryOnCopy(tryOnFeature),
    [tryOnFeature]
  );

  useEffect(() => {
    if (stage !== "processing") {
      setLookLine(0);
      return;
    }
    const tick = window.setInterval(() => {
      setLookLine((i) => (i + 1) % copy.lookLines.length);
    }, 1800);
    return () => window.clearInterval(tick);
  }, [stage, copy.lookLines]);

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name || "";
  const busy = stage === "working";
  const selectionReady = needsCatalogProduct
    ? Boolean(productId)
    : tryOnFeature === "haircolor"
      ? Boolean(hairColorPreset)
      : tryOnFeature === "beard"
        ? Boolean(beardTemplateId)
        : false;
  const canGenerate = Boolean(source && selectionReady) && !busy;

  const catalogProducts = useMemo(() => {
    if (!isSalon) return products;
    // Salon hairstyle mode: only products in hair (or unset) categories
    return products.filter((p) => {
      const cat = p.category
        ? categories.find((c) => c.id === p.category)
        : null;
      const feat = cat?.tryOnFeature || "hair";
      return feat === "hair";
    });
  }, [products, categories, isSalon]);

  const visibleProducts =
    filter === "all"
      ? catalogProducts
      : catalogProducts.filter((p) => p.category === filter);

  const filters = [
    { id: "all", label: "All" },
    ...categories
      .filter((c) => {
        if (!catalogProducts.some((p) => p.category === c.id)) return false;
        if (isSalon && (c.tryOnFeature || "hair") !== "hair") return false;
        return true;
      })
      .map((c) => ({ id: c.id, label: c.name })),
  ];

  function openPicker() {
    fileRef.current?.click();
  }

  function requestPick() {
    if (busy) return;
    if (!source && !isPhotoGuideDismissed()) {
      setGuideOpen(true);
      return;
    }
    openPicker();
  }

  async function pickFile(f: File | null) {
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
    try {
      const { width, height } = await readImageDimensions(f);
      if (tryOnImageTooSmall(width, height)) {
        setError(tryOnImageSizeMessage(width, height));
        return;
      }
    } catch {
      setError("Could not read image. Try another file.");
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

  function switchMode(next: TryOnFeature) {
    setSessionFeature(next);
    setProductId("");
    setFilter("all");
    setError("");
  }

  async function submit() {
    setError("");
    if (!source) {
      const msg = "Upload a customer photo first.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (needsCatalogProduct && !productId) {
      const msg =
        tryOnFeature === "hair"
          ? "Select a hairstyle from your catalog."
          : "Select a product to try on.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (tryOnFeature === "haircolor" && !hairColorPreset) {
      const msg = "Pick a hair color shade.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (tryOnFeature === "beard" && !beardTemplateId) {
      const msg = "Pick a beard style.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (balance != null && balance < 1) {
      const msg = "Not enough credits. Buy credits to generate a try-on.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setStage("working");
    track("b2b_tryon_started", { count: 1, feature: tryOnFeature });
    try {
      const fd = new FormData();
      fd.append("count", "1");
      fd.append("source", source);
      fd.append("feature", tryOnFeature);
      if (needsCatalogProduct && productId) {
        fd.append("productId", productId);
      }
      if (tryOnFeature === "haircolor") {
        fd.append("hairColorPreset", hairColorPreset);
      }
      if (tryOnFeature === "beard") {
        fd.append("beardTemplateId", beardTemplateId);
      }
      const res = await createB2BTryon(fd);
      setBalance(res.credits);
      setJob(res.job);
      setStage("processing");
      toast.success("Try-on started");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
      setStage("form");
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

  const showEmptyCatalogGate =
    !isSalon && products.length === 0
      ? true
      : isSalon && sessionFeature === "hair" && catalogProducts.length === 0;

  return (
    <div className="mx-auto max-w-5xl">
      {isSalon && modeOptions.length > 1 && (stage === "form" || stage === "working") && (
        <div className="mb-4 flex flex-wrap gap-2">
          {modeOptions.map((opt) => {
            const active = sessionFeature === opt.id;
            const builtIn = opt.id === "haircolor" || opt.id === "beard";
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => switchMode(opt.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-sage text-paper"
                    : "border border-ink/12 text-ink-muted hover:border-ink/25 hover:text-ink dark:border-white/12"
                }`}
              >
                {opt.label}
                {builtIn && (
                  <span
                    className={`ml-1.5 text-[10px] font-medium uppercase tracking-wide ${
                      active ? "text-paper/80" : "text-ink-muted"
                    }`}
                  >
                    built-in
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {showEmptyCatalogGate ? (
        <div className="mt-2 card rounded-2xl px-6 py-12 text-center">
          <p className="text-ink-muted">
            {isSalon
              ? `Upload hairstyle photos in Catalog for ${tryOnFeatureLabel("hair")}. ${tryOnFeatureLabel("haircolor")} and ${tryOnFeatureLabel("beard")} are ready without uploads.`
              : "You need at least one product with an image to run a try-on."}
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
                    onClick={requestPick}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        requestPick();
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
                            className="rounded-full bg-black/55 px-3 py-2 text-xs font-semibold text-paper backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-50"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => pickFile(null)}
                            className="rounded-full bg-black/55 px-3 py-2 text-xs font-semibold text-paper/90 backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-50"
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
                  <PhotoGuideModal
                    open={guideOpen}
                    onClose={() => setGuideOpen(false)}
                    onSelect={() => {
                      setGuideOpen(false);
                      openPicker();
                    }}
                  />
                </section>

                <section className="flex w-full flex-col rounded-2xl border border-ink/10 bg-white/40 p-3.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] lg:w-[15.5rem]">
                  <h3 className="whitespace-nowrap font-display text-base font-semibold text-ink">
                    {copy.selectedTitle}
                  </h3>

                  <div
                    className={`relative mx-auto mt-3 h-[13.5rem] w-[10.125rem] overflow-hidden rounded-xl border text-center sm:h-[14.5rem] sm:w-[10.875rem] ${
                      selectionReady
                        ? "border-ink/10 dark:border-white/10"
                        : "border-dashed border-ink/15 dark:border-white/15"
                    }`}
                  >
                    {needsCatalogProduct && selectedProduct ? (
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
                            className="rounded-full bg-black/55 px-3 py-2 text-xs font-semibold text-paper backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-50"
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
                              tryOnFeatureLabel(tryOnFeature),
                              formatPrice(selectedProduct),
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </>
                    ) : tryOnFeature === "haircolor" && hairColorPreset ? (
                      <div className="flex h-full flex-col items-center justify-center gap-3 bg-ink/[0.03] px-3 dark:bg-[#14120f]">
                        <span
                          className="h-16 w-16 rounded-full border border-ink/10 shadow-inner"
                          style={{
                            background: (() => {
                              const opt = hairColorOptions.find(
                                (o) => o.name === hairColorPreset
                              );
                              if (!opt) return "#888";
                              return opt.swatch.secondary
                                ? `linear-gradient(135deg, ${opt.swatch.primary} 50%, ${opt.swatch.secondary} 50%)`
                                : opt.swatch.primary;
                            })(),
                          }}
                        />
                        <p className="text-xs font-semibold text-ink">
                          {hairColorPreset}
                        </p>
                        <p className="text-[10px] text-ink-muted">Built-in shade</p>
                      </div>
                    ) : tryOnFeature === "beard" && beardTemplateId ? (
                      <div className="flex h-full flex-col items-center justify-center gap-2 bg-ink/[0.03] px-3 dark:bg-[#14120f]">
                        {(() => {
                          const t = beardTemplates.find(
                            (b) => b.id === beardTemplateId
                          );
                          return (
                            <>
                              <p className="text-xs font-semibold text-ink">
                                {t?.title || beardTemplateId}
                              </p>
                              <p className="text-[10px] text-ink-muted">
                                Built-in beard style
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center bg-ink/[0.03] px-3 dark:bg-[#14120f]">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/10 text-sage">
                          <HangerIcon />
                        </div>
                        <div className="mt-2 text-xs font-semibold text-ink">
                          {copy.selectedEmpty}
                        </div>
                        <div className="mt-0.5 text-[10px] leading-snug text-ink-muted">
                          {needsCatalogProduct
                            ? "Choose from the catalog below"
                            : "Choose below"}
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
                    {balance != null && (
                      <>
                        {" "}
                        Balance:{" "}
                        <span className="font-semibold text-ink">
                          {balance}
                        </span>
                      </>
                    )}
                  </p>
                  {balance != null && balance < 1 && (
                    <p className="mt-2 max-w-[16rem] text-center text-xs text-red-600">
                      No credits left.{" "}
                      <Link
                        href="/business/credits"
                        className="font-semibold underline underline-offset-2"
                      >
                        Buy credits
                      </Link>{" "}
                      to generate.
                    </p>
                  )}
                  {error && (
                    <p className="mt-2 max-w-[16rem] text-center text-xs text-red-600">
                      {error}
                    </p>
                  )}
                  <button
                    onClick={submit}
                    disabled={!canGenerate || (balance != null && balance < 1)}
                    className="mt-4 flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-sage px-6 py-3 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-50"
                  >
                    {busy && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
                    )}
                    {busy
                      ? "Submitting…"
                      : balance != null && balance < 1
                        ? "Need credits"
                        : "Generate Try-On"}
                  </button>
                </section>
              </div>

              {/* Catalog product carousel OR PerfectCorp built-in pickers */}
              <section className="mt-6">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink">
                      {copy.catalogTitle}
                    </h3>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {copy.catalogDesc}
                    </p>
                  </div>
                </div>

                {tryOnFeature === "haircolor" ? (
                  <div className="mt-4 rounded-2xl border border-ink/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    {hairColorOptions.length === 0 ? (
                      <p className="text-sm text-ink-muted">Loading shades…</p>
                    ) : (
                      <HairColorPicker
                        options={hairColorOptions}
                        value={hairColorPreset}
                        onChange={setHairColorPreset}
                        label="Tap a shade"
                      />
                    )}
                  </div>
                ) : tryOnFeature === "beard" ? (
                  <div className="mt-4 rounded-2xl border border-ink/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    {beardTemplates.length === 0 ? (
                      <p className="text-sm text-ink-muted">Loading styles…</p>
                    ) : (
                      <BeardStylePicker
                        templates={beardTemplates}
                        value={beardTemplateId}
                        onChange={setBeardTemplateId}
                        label="Tap a style"
                      />
                    )}
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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
                {copy.lookLines[lookLine]}
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
            <TryOnResultReady
              resultImageUrls={job.resultImageUrls}
              badge={`${job.creditsCost} credit${job.creditsCost > 1 ? "s" : ""} used${
                selectedProduct ? ` · ${selectedProduct.name}` : ""
              }`}
              onTryAnother={reset}
              challengePath="/try-on"
            />
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
