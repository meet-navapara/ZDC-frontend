"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { TryOnShareActions } from "@/components/TryOnShareActions";
import { PageLoader } from "@/components/PageLoader";
import { getJob, type B2BJob } from "@/lib/b2b";

export default function B2BTryOnResultPage() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();
  const jobId = params.jobId;

  const [job, setJob] = useState<B2BJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeResult, setActiveResult] = useState(0);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    getJob(jobId)
      .then((r) => {
        if (cancelled) return;
        setJob(r.job);
        setError("");
        setActiveResult(0);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load this render.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (loading) {
    return <PageLoader label="Loading your render…" />;
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-md">
        <Link
          href="/business/try-on"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-sage transition hover:text-sage-dark"
        >
          <span aria-hidden>←</span>
          Back to Try-On
        </Link>
        <div className="rounded-2xl border border-red-300 bg-red-50 px-6 py-5 text-center text-red-700">
          {error || "Render not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/business/try-on"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sage transition hover:text-sage-dark"
      >
        <span aria-hidden>←</span>
        Back to Try-On
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Render result
          </h1>
          <p className="mt-1 text-ink-muted">
            Your customer&apos;s try-on is ready.
          </p>
        </div>
        <Link
          href="/business/try-on"
          className="rounded-full border border-ink/15 px-6 py-2.5 font-semibold text-ink transition hover:border-ink/30"
        >
          New try-on
        </Link>
      </div>

      <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-sage/10 px-4 py-1.5 text-sm font-semibold text-sage-dark">
        ✓ Render complete · {job.creditsCost} credit
        {job.creditsCost > 1 ? "s" : ""} used
      </span>

      {job.resultImageUrls.length === 0 ? (
        <p className="mt-8 text-ink-muted">No result images were returned.</p>
      ) : (
        <div className="mx-auto mt-6 max-w-2xl text-center">
          <div className="flex flex-wrap items-start justify-center gap-6">
            {job.resultImageUrls.map((url, i) => {
              const selected = activeResult === i;
              return (
                <div key={i} className="w-48 sm:w-60 md:w-72">
                  <button
                    type="button"
                    onClick={() => setActiveResult(i)}
                    className={`group w-full overflow-hidden rounded-2xl border transition ${
                      selected
                        ? "border-sage shadow-[0_18px_40px_-20px_rgba(47,93,80,0.45)] ring-2 ring-sage/40"
                        : "border-ink/10 hover:border-sage/40 hover:shadow-md"
                    }`}
                    aria-pressed={selected}
                    aria-label={`Select look ${i + 1}`}
                  >
                    <div className="relative aspect-[3/4] bg-[#f0ece4] dark:bg-[#18150f]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={apiUrl(url)}
                        alt={`Result ${i + 1}`}
                        className="absolute inset-0 h-full w-full object-contain transition duration-700 ease-out group-hover:scale-[1.02]"
                      />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {job.resultImageUrls[activeResult] && (
            <TryOnShareActions
              imageUrl={job.resultImageUrls[activeResult]}
              filename={`zimji-tryon-${activeResult + 1}.png`}
              onTryAnother={() => router.push("/business/try-on")}
              challengePath="/try-on"
            />
          )}
        </div>
      )}
    </div>
  );
}
