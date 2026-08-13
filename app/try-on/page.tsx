"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { apiGet, apiPost, apiPostForm, apiUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { TryOnShareActions } from "@/components/TryOnShareActions";

type Pack = {
  id: string;
  label: string;
  images: number;
  amount: number;
  currency: string;
};

type Job = {
  id: string;
  pack: string;
  imageCount: number;
  amount: number;
  currency: string;
  sourceImageUrl: string;
  targetImageUrl: string;
  resultImageUrls: string[];
  status: "awaiting_payment" | "processing" | "completed" | "failed";
};

type Stage = "form" | "working" | "processing" | "done" | "error";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB — must match backend limit
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Use a PNG, JPG, or WEBP image.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "Image is larger than 10 MB.";
  }
  return null;
}

function UploadBox({
  label,
  hint,
  file,
  onPick,
  sizeClass = "aspect-[3/4]",
  compact = false,
}: {
  label: string;
  hint: string;
  file: File | null;
  onPick: (f: File | null) => void;
  sizeClass?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string>("");

  // Create/revoke the preview URL alongside the file so we don't leak object URLs.
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function accept(f: File | null) {
    setLocalError("");
    if (!f) {
      onPick(null);
      return;
    }
    const err = validateImage(f);
    if (err) {
      setLocalError(err);
      return;
    }
    onPick(f);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          accept(e.dataTransfer.files?.[0] || null);
        }}
        className={`group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl text-center transition ${sizeClass} ${
          dragOver
            ? "border-2 border-dashed border-sage bg-sage/10"
            : preview
            ? "border border-ink/10 shadow-sm"
            : "border-2 border-dashed border-ink/15 bg-white/50 hover:border-sage hover:bg-white"
        }`}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={label}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-ink/55 px-2.5 py-0.5 text-[10px] font-semibold text-paper backdrop-blur-sm">
              {label}
            </span>
            <button
              type="button"
              aria-label={`Remove ${label}`}
              onClick={(e) => {
                e.stopPropagation();
                accept(null);
              }}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink/55 text-sm leading-none text-paper opacity-0 backdrop-blur-sm transition hover:bg-ink group-hover:opacity-100"
            >
              ×
            </button>
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent pb-2 pt-6 text-xs font-medium text-paper opacity-0 transition group-hover:opacity-100">
              Click to change
            </span>
          </>
        ) : (
          <div className="px-3">
            <div
              className={`mx-auto flex items-center justify-center rounded-full bg-sage/10 text-sage transition group-hover:bg-sage/20 ${
                compact ? "h-9 w-9 text-lg" : "h-12 w-12 text-xl"
              }`}
            >
              +
            </div>
            <div
              className={`font-semibold text-ink ${
                compact ? "mt-2 text-xs" : "mt-3 text-sm"
              }`}
            >
              {label}
            </div>
            {!compact && (
              <>
                <div className="mt-1 text-xs text-ink-muted">{hint}</div>
                <div className="mt-2 text-[11px] text-ink-muted/70">
                  Drag &amp; drop · PNG/JPG/WEBP · 10 MB
                </div>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0] || null)}
        />
      </div>

      {localError && (
        <p className="mt-1.5 px-1 text-xs text-red-600">{localError}</p>
      )}
    </div>
  );
}

function SectionHead({
  n,
  title,
  desc,
}: {
  n: number;
  title: string;
  desc?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper">
        {n}
      </span>
      <div>
        <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
        {desc && <p className="mt-0.5 text-sm text-ink-muted">{desc}</p>}
      </div>
    </div>
  );
}

export default function TryOnPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [packId, setPackId] = useState<string>("single");
  const [source, setSource] = useState<File | null>(null);
  const [targets, setTargets] = useState<(File | null)[]>([null]);
  const [sourcePreview, setSourcePreview] = useState<string>("");
  const [stage, setStage] = useState<Stage>("form");
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [activeResult, setActiveResult] = useState(0);

  useEffect(() => {
    apiGet<{ packs: Pack[] }>("/api/tryon/pricing")
      .then((r) => {
        setPacks(r.packs);
        if (r.packs.length && !r.packs.some((p) => p.id === packId)) {
          setPackId(r.packs[0].id);
        }
      })
      .catch(() => setPacks([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for result once a job is processing
  useEffect(() => {
    if (stage !== "processing" || !job) return;
    const interval = setInterval(async () => {
      try {
        const r = await apiGet<{ job: Job }>(`/api/tryon/${job.id}`);
        if (r.job.status === "completed") {
          setJob(r.job);
          setStage("done");
          setActiveResult(0);
          track("b2c_render_completed", {
            pack: r.job.pack,
            results: r.job.resultImageUrls.length,
          });
          clearInterval(interval);
        } else if (r.job.status === "failed") {
          setError("Rendering failed. Please try again.");
          setStage("error");
          clearInterval(interval);
        }
      } catch {
        // keep polling
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [stage, job]);

  const selectedPack = packs.find((p) => p.id === packId);
  const targetCount = selectedPack?.images ?? 1;

  // Keep one outfit upload slot per rendered image in the selected pack.
  useEffect(() => {
    setTargets((prev) => {
      if (prev.length === targetCount) return prev;
      const next = prev.slice(0, targetCount);
      while (next.length < targetCount) next.push(null);
      return next;
    });
  }, [targetCount]);

  const targetsFilled =
    targets.length === targetCount && targets.every(Boolean);
  const canSubmit = !!source && targetsFilled && stage !== "working";

  async function handleSubmit() {
    setError("");
    if (!source || targets.some((t) => !t)) {
      setError(
        `Please upload your selfie and ${targetCount} outfit image${
          targetCount > 1 ? "s" : ""
        }.`
      );
      return;
    }
    setStage("working");
    track("b2c_tryon_started", { pack: packId });
    // Keep a stable preview of the source selfie for the before/after view.
    setSourcePreview(URL.createObjectURL(source));
    try {
      const token = getToken() || undefined;
      const form = new FormData();
      form.append("pack", packId);
      form.append("source", source);
      targets.forEach((t) => {
        if (t) form.append("target", t);
      });

      const created = await apiPostForm<{ job: Job }>("/api/tryon", form, token);

      const paid = await apiPost<{ job: Job }>(
        "/api/payments",
        { jobId: created.job.id, gateway: "stub" },
        token
      );

      track("b2c_payment_succeeded", {
        pack: packId,
        amount: paid.job.amount,
        currency: paid.job.currency,
      });
      setJob(paid.job);
      setStage("processing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    }
  }

  function reset() {
    if (sourcePreview) URL.revokeObjectURL(sourcePreview);
    setSource(null);
    setTargets((prev) => prev.map(() => null));
    setSourcePreview("");
    setJob(null);
    setError("");
    setActiveResult(0);
    setStage("form");
  }

  return (
    <main className="min-h-screen">
      <AppHeader />
      <section className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
        {(stage === "form" || stage === "working") && (
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
            {/* Panel 1 — photos */}
            <div className="card rounded-2xl p-5 sm:rounded-3xl sm:p-8">
              <SectionHead
                n={1}
                title="Upload your photos"
                desc={
                  targetCount > 1
                    ? `Your selfie plus ${targetCount} different outfits — one styled result each.`
                    : "Your selfie and the outfit or hairstyle you want to try."
                }
              />
              <div
                className={`mt-5 grid gap-3 sm:mt-6 sm:gap-4 ${
                  targetCount > 1
                    ? "grid-cols-2 sm:grid-cols-4"
                    : "mx-auto max-w-md grid-cols-2"
                }`}
              >
                <UploadBox
                  label="Your selfie"
                  hint="Clear, front-facing"
                  file={source}
                  onPick={setSource}
                  compact={targetCount > 1}
                />
                {targets.map((t, i) => (
                  <UploadBox
                    key={i}
                    label={
                      targetCount > 1 ? `Outfit ${i + 1}` : "Outfit / hairstyle"
                    }
                    hint="Dress, braids…"
                    file={t}
                    onPick={(f) =>
                      setTargets((prev) =>
                        prev.map((x, idx) => (idx === i ? f : x))
                      )
                    }
                    compact={targetCount > 1}
                  />
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-ink-muted">
                PNG, JPG or WEBP · up to 10 MB each
              </p>
            </div>

            {/* Panel 2 — pack + checkout */}
            <div className="card rounded-2xl p-5 sm:rounded-3xl sm:p-8">
              <SectionHead n={2} title="Choose your pack" />
              <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 sm:grid-cols-2">
                {packs.length === 0 && (
                  <>
                    <div className="h-[132px] animate-pulse rounded-2xl bg-ink/5" />
                    <div className="h-[132px] animate-pulse rounded-2xl bg-ink/5" />
                  </>
                )}
                {packs.map((p) => {
                  const selected = packId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPackId(p.id)}
                      className={`relative flex flex-col rounded-2xl border p-5 text-left transition ${
                        selected
                          ? "border-sage bg-sage/5 shadow-sm ring-2 ring-sage/25"
                          : "border-ink/10 bg-white/70 hover:border-sage/40 hover:shadow-md"
                      }`}
                    >
                      {selected && (
                        <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-sage text-xs font-bold text-paper">
                          ✓
                        </span>
                      )}
                      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-sage">
                        {p.label}
                      </span>
                      <span className="mt-3 font-display text-3xl font-semibold text-ink">
                        {p.currency} {p.amount}
                      </span>
                      <span className="mt-1 text-sm text-ink-muted">
                        {p.images} outfit{p.images > 1 ? "s" : ""} →{" "}
                        {p.images} styled result{p.images > 1 ? "s" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            </div>

            {/* Sidebar — price details */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="card rounded-2xl p-5 sm:rounded-3xl sm:p-6">
                <h3 className="font-display text-lg font-semibold text-ink">
                  Price details
                </h3>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-muted">Pack</dt>
                    <dd className="font-medium text-ink">
                      {selectedPack?.label ?? "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-muted">Styled results</dt>
                    <dd className="font-medium text-ink">
                      {targetCount} image{targetCount > 1 ? "s" : ""}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-muted">Delivery</dt>
                    <dd className="font-semibold text-sage-dark">FREE</dd>
                  </div>
                </dl>
                <div className="my-4 h-px bg-ink/10" />
                <div className="flex items-end justify-between">
                  <span className="text-sm font-semibold text-ink">
                    Total payable
                  </span>
                  <span className="font-display text-2xl font-semibold text-ink">
                    {selectedPack
                      ? `${selectedPack.currency} ${selectedPack.amount}`
                      : "—"}
                  </span>
                </div>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-sage py-4 text-base font-semibold text-paper shadow-lg shadow-sage/20 transition hover:bg-sage-dark hover:shadow-sage/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                >
                  {stage === "working" && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
                  )}
                  {stage === "working"
                    ? "Processing…"
                    : selectedPack
                    ? `Pay ${selectedPack.currency} ${selectedPack.amount}`
                    : "Pay & Render"}
                </button>
                {!canSubmit && stage !== "working" && (
                  <p className="mt-2 text-center text-xs text-ink-muted">
                    Add your selfie and all outfit photos to continue.
                  </p>
                )}
                <p className="mt-3 text-center text-[11px] text-ink-muted/80">
                  Secure checkout · Photos used only for this render.
                </p>
              </div>

              <div className="card rounded-3xl p-6">
                <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted">
                  What&apos;s included
                </h4>
                <ul className="mt-4 space-y-3 text-sm text-ink">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-sage">✓</span>
                    High-resolution AI renders
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-sage">✓</span>
                    Instant delivery — download right away
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-sage">✓</span>
                    Private — photos used only for this render
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        )}

        {stage === "processing" && (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
            <h3 className="mt-6 font-display text-2xl font-semibold text-ink">
              Rendering your look…
            </h3>
            <p className="mt-2 text-ink-muted">
              Our AI is styling your try-on. This takes a few seconds.
            </p>
          </div>
        )}

        {stage === "done" && job && (
          <div className="mx-auto mt-10 max-w-3xl">
            <div className="card rounded-3xl p-6 text-center sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-sage/10 px-4 py-1.5 text-sm font-semibold text-sage-dark">
                ✓ Your try-on is ready
              </span>

              <div className="mt-6 flex flex-wrap items-start justify-center gap-5">
                {sourcePreview && (
                  <div className="w-40 sm:w-44">
                    <div className="overflow-hidden rounded-2xl border border-ink/10 shadow-sm">
                      <div className="relative aspect-[3/4]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sourcePreview}
                          alt="Your original selfie"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Before
                    </p>
                  </div>
                )}

                {job.resultImageUrls.map((url, i) => {
                  const selected = activeResult === i;
                  return (
                    <div key={i} className="w-40 sm:w-44">
                      <button
                        type="button"
                        onClick={() => setActiveResult(i)}
                        className={`w-full overflow-hidden rounded-2xl border shadow-sm transition ${
                          selected
                            ? "border-sage ring-2 ring-sage/40"
                            : "border-ink/10 hover:border-sage/40"
                        }`}
                        aria-pressed={selected}
                        aria-label={`Select look ${i + 1}`}
                      >
                        <div className="relative aspect-[3/4]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={apiUrl(url)}
                            alt={`Try-on result ${i + 1}`}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        </div>
                      </button>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-sage-dark">
                        {job.resultImageUrls.length > 1
                          ? `Look ${i + 1}${selected ? " · selected" : ""}`
                          : "After"}
                      </p>
                    </div>
                  );
                })}
              </div>

              {job.resultImageUrls[activeResult] && (
                <TryOnShareActions
                  imageUrl={job.resultImageUrls[activeResult]}
                  filename={`zdc-tryon-${activeResult + 1}.png`}
                  onTryAnother={reset}
                  challengePath="/try-on"
                />
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
              onClick={() => setStage("form")}
              className="mt-6 rounded-full bg-sage px-8 py-3 font-semibold text-paper transition hover:bg-sage-dark"
            >
              Back
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
