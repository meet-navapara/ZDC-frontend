"use client";

import { Suspense } from "react";
import HistoryInner from "./HistoryInner";

export default function ConsumerHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
        </div>
      }
    >
      <HistoryInner />
    </Suspense>
  );
}
