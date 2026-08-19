"use client";

import { Suspense } from "react";
import B2cTryOnStudio from "@/components/B2cTryOnStudio";

export default function ConsumerTryOnPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Try-On</h1>
        <p className="mt-1 text-ink-muted">
          Upload a selfie, pick a pack, and get styled results in seconds.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
          </div>
        }
      >
        <B2cTryOnStudio />
      </Suspense>
    </div>
  );
}
