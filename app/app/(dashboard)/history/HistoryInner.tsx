"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import { useSearchParams } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { listMyJobs, type B2cJob } from "@/lib/b2c";
import { TryOnShareActions } from "@/components/TryOnShareActions";
import { PageLoader } from "@/components/PageLoader";

const HOURS_72 = 72 * 60 * 60 * 1000;

function expiresInLabel(createdAt: string | Date): string | null {
  const created = new Date(createdAt).getTime();
  const remaining = created + HOURS_72 - Date.now();
  if (remaining <= 0) return "Expired";
  const h = Math.floor(remaining / (60 * 60 * 1000));
  if (h >= 2) return `Expires in ${h}h`;
  const m = Math.floor(remaining / 60000);
  return `Expires in ${m}m`;
}

const STATUS_TONE: Record<string, string> = {
  completed: "bg-sage/10 text-sage-dark border-sage/30",
  processing: "bg-amber-50 text-amber-800 border-amber-200",
  awaiting_payment: "bg-ink/5 text-ink-muted border-ink/15",
  failed: "bg-red-50 text-red-700 border-red-200",
};

function money(n: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en-US").format(n)}`;
}

export default function HistoryInner() {
  const search = useSearchParams();
  const focusId = search.get("job");
  const [jobs, setJobs] = useState<B2cJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [active, setActive] = useState<B2cJob | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    listMyJobs({
      limit: 40,
      status: filter || undefined,
    })
      .then((r) => {
        setJobs(r.jobs);
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load history")
      )
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!focusId || !jobs.length) return;
    const found = jobs.find((j) => j.id === focusId);
    if (found) {
      setActive(found);
      setActiveIdx(0);
    }
  }, [focusId, jobs]);

  const completedCount = useMemo(
    () => jobs.filter((j) => j.status === "completed").length,
    [jobs]
  );

  if (loading && jobs.length === 0) {
    return <PageLoader label="Loading history…" />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            History
          </h1>
          <p className="mt-1 text-ink-muted">
            Browse past try-ons and reopen your photos anytime.
          </p>
        </div>
        <CustomSelect
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "", label: "All statuses" },
            { value: "completed", label: "Completed" },
            { value: "processing", label: "Processing" },
            { value: "failed", label: "Failed" },
          ]}
        />
      </div>

      {/* 72-hour retention warning */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <span className="mt-0.5 text-base">⏳</span>
        <p>
          <span className="font-semibold">72-hour history limit —</span> Try-on
          records and photos are automatically deleted 72 hours after creation
          to keep your storage healthy. Download any results you want to keep.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="mt-4 text-sm text-ink-muted">
        {`${jobs.length} try-on${jobs.length === 1 ? "" : "s"}${
          completedCount ? ` · ${completedCount} with photos` : ""
        }`}
      </p>

      {jobs.length === 0 ? (
        <div className="card mt-6 rounded-2xl px-6 py-12 text-center text-ink-muted">
          No try-ons match this filter yet.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const thumb = job.resultImageUrls[0] || job.sourceImageUrl || null;
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => {
                  setActive(job);
                  setActiveIdx(0);
                }}
                className="card group overflow-hidden rounded-2xl text-left transition hover:border-sage/40"
              >
                <div className="relative aspect-[3/4] bg-ink/5">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={apiUrl(thumb)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                  <span
                    className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
                      STATUS_TONE[job.status] || STATUS_TONE.awaiting_payment
                    }`}
                  >
                    {job.status.replace("_", " ")}
                  </span>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold capitalize text-ink">
                      {job.pack || "Try-on"}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-ink">
                      {money(job.amount, job.currency)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-ink-muted">
                    {job.createdAt
                      ? new Date(job.createdAt).toLocaleString()
                      : ""}
                    {job.resultImageUrls.length
                      ? ` · ${job.resultImageUrls.length} photo${
                          job.resultImageUrls.length === 1 ? "" : "s"
                        }`
                      : ""}
                  </div>
                  {job.createdAt && (
                    <div className="mt-1 text-[11px] font-medium text-amber-600">
                      {expiresInLabel(job.createdAt)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ink/10 bg-paper-100 p-5 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold capitalize text-ink">
                  {active.pack || "Try-on"} look
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {active.createdAt
                    ? new Date(active.createdAt).toLocaleString()
                    : ""}{" "}
                  · {money(active.amount, active.currency)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded-full border border-ink/15 px-3 py-1 text-sm text-ink-muted hover:text-ink"
              >
                Close
              </button>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-4">
              <div className="w-36 sm:w-40">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-ink/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={apiUrl(active.sourceImageUrl)}
                    alt="Selfie"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <p className="mt-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Before
                </p>
              </div>
              {active.resultImageUrls.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`w-36 sm:w-40 ${
                    activeIdx === i ? "rounded-xl ring-2 ring-sage" : ""
                  }`}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-ink/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={apiUrl(url)}
                      alt={`Result ${i + 1}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <p className="mt-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-sage-dark">
                    Look {i + 1}
                  </p>
                </button>
              ))}
            </div>

            {active.resultImageUrls[activeIdx] && (
              <div className="mt-4">
                <TryOnShareActions
                  imageUrl={active.resultImageUrls[activeIdx]}
                  filename={`zimji-history-${activeIdx + 1}.png`}
                  challengePath="/app/try-on"
                />
              </div>
            )}

            {!active.resultImageUrls.length && (
              <p className="mt-4 text-center text-sm text-ink-muted">
                No result photos for this try-on yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
