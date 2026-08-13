"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "@/lib/api";
import { track } from "@/lib/analytics";
import { TryOnShareActions } from "@/components/TryOnShareActions";
import {
  listProducts,
  createB2BTryon,
  getJob,
  getBalance,
  type Product,
  type B2BJob,
} from "@/lib/b2b";

type Stage = "form" | "working" | "processing" | "done" | "error";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

const STEPS = ["Photo", "Product", "Render"] as const;

function StepIndicator({ index }: { index: number }) {
  return (
    <div className="mx-auto mt-4 flex max-w-sm items-center justify-between">
      {STEPS.map((label, i) => {
        const done = i < index;
        const current = i === index;
        return (
          <div key={label} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition ${
                  done
                    ? "border-sage bg-sage text-paper"
                    : current
                    ? "border-sage bg-sage/10 text-sage-dark"
                    : "border-ink/15 bg-white/60 text-ink-muted"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1.5 text-[11px] font-medium ${
                  current || done ? "text-ink" : "text-ink-muted"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 mt-4 h-0.5 flex-1 rounded-full transition ${
                  i < index ? "bg-sage" : "bg-ink/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function B2BTryOnPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [productId, setProductId] = useState<string>("");
  const [source, setSource] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [stage, setStage] = useState<Stage>("form");
  const [job, setJob] = useState<B2BJob | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => (source ? URL.createObjectURL(source) : null), [source]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    Promise.all([
      listProducts({ status: "active" }).catch(() => ({ products: [] })),
      getBalance().catch(() => ({ balance: 0 })),
    ]).then(([p, b]) => {
      const active = p.products.filter((x) => x.imageUrls.length > 0);
      setProducts(active);
      if (active.length) setProductId(active[0].id);
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

  const selectedProduct = products.find((p) => p.id === productId);

  function pickFile(f: File | null) {
    setError("");
    if (!f) {
      setSource(null);
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

  async function submit() {
    setError("");
    if (!productId) {
      setError("Select a product to try on.");
      return;
    }
    if (!source) {
      setError("Upload a customer selfie.");
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
    setJob(null);
    setError("");
    setStep(1);
    setStage("form");
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
          {stage !== "error" && (
            <StepIndicator
              index={
                stage === "form" ? step - 1 : stage === "done" ? 3 : 2
              }
            />
          )}

          {/* Step 1 — Customer photo */}
          {stage === "form" && step === 1 && (
            <div className="mx-auto mt-6 max-w-md">
              <h3 className="text-center font-display text-lg font-semibold text-ink">
                Customer photo
              </h3>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative mt-3 flex aspect-[16/10] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-ink/15 bg-white/60 text-center transition hover:border-sage"
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="customer"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="px-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage/10 text-xl text-sage">
                      +
                    </div>
                    <div className="mt-3 font-semibold text-ink">
                      Upload selfie
                    </div>
                    <div className="mt-1 text-xs text-ink-muted">
                      PNG/JPG/WEBP · max 10 MB
                    </div>
                  </div>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] || null)}
              />

              {error && (
                <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={() => {
                  if (!source) {
                    setError("Upload a customer selfie.");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                disabled={!source}
                className="mt-5 w-full rounded-full bg-sage py-3 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2 — Choose product + render */}
          {((stage === "form" && step === 2) || stage === "working") && (
            <div className="mx-auto mt-8 max-w-2xl">
              {/* Selfie summary */}
              <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/60 p-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-ink/5">
                  {preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt="customer"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink">
                    Customer photo ready
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={stage === "working"}
                    className="text-xs font-semibold text-sage transition hover:text-sage-dark disabled:opacity-50"
                  >
                    Change photo
                  </button>
                </div>
              </div>

              <h3 className="mt-6 font-display text-lg font-semibold text-ink">
                Choose product
              </h3>
              <div className="mt-3 grid max-h-[360px] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProductId(p.id)}
                    className={`relative aspect-[3/4] overflow-hidden rounded-xl border-2 transition ${
                      productId === p.id
                        ? "border-sage"
                        : "border-transparent hover:border-ink/20"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={apiUrl(p.imageUrls[0])}
                      alt={p.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    {productId === p.id && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sage text-xs text-paper">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {selectedProduct && (
                <p className="mt-2 text-sm text-ink-muted">
                  Selected:{" "}
                  <span className="font-semibold text-ink">
                    {selectedProduct.name}
                  </span>
                </p>
              )}

              <p className="mt-4 text-sm text-ink-muted">
                Each render uses{" "}
                <span className="font-semibold text-ink">1 credit</span> and
                produces 1 image.
              </p>

              {error && (
                <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  disabled={stage === "working"}
                  className="rounded-full border border-ink/15 px-6 py-3 font-semibold text-ink transition hover:border-ink/30 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={submit}
                  disabled={stage === "working"}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-sage py-3 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
                >
                  {stage === "working" && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
                  )}
                  {stage === "working" ? "Submitting…" : "Render (1 credit)"}
                </button>
              </div>
            </div>
          )}

          {stage === "processing" && (
            <div className="mt-16 flex flex-col items-center text-center">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
              <h3 className="mt-6 font-display text-2xl font-semibold text-ink">
                Rendering…
              </h3>
              <p className="mt-2 text-ink-muted">
                Styling the customer on your product. A few seconds.
              </p>
            </div>
          )}

          {/* Step 3 — Result (inline) */}
          {stage === "done" && job && (
            <div className="mx-auto mt-8 max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-sage/10 px-4 py-1.5 text-sm font-semibold text-sage-dark">
                ✓ Render complete · {job.creditsCost} credit
                {job.creditsCost > 1 ? "s" : ""} used
              </span>

              <div className="mt-6 flex flex-wrap justify-center gap-6">
                {job.resultImageUrls.map((url, i) => (
                  <div key={i} className="w-44 sm:w-52">
                    <div className="card overflow-hidden rounded-2xl">
                      <div className="relative aspect-[3/4]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={apiUrl(url)}
                          alt={`Result ${i + 1}`}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {job.resultImageUrls[0] && (
                <TryOnShareActions
                  imageUrl={job.resultImageUrls[0]}
                  filename="zdc-tryon-1.png"
                  onTryAnother={reset}
                  challengePath="/try-on"
                />
              )}
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
                  setStep(1);
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
