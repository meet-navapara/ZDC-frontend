"use client";

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
      <B2cTryOnStudio />
    </div>
  );
}
