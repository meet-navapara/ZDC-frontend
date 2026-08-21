"use client";

import { Suspense } from "react";
import B2cTryOnStudio from "@/components/B2cTryOnStudio";

export default function ConsumerTryOnPage() {
  return (
    <div className="mx-auto max-w-5xl">
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
