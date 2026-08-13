"use client";

import posthog from "posthog-js";

type Props = Record<string, unknown>;

function ready() {
  return typeof window !== "undefined" && posthog.__loaded;
}

// Capture a product event. No-ops when PostHog isn't configured/loaded.
export function track(event: string, props?: Props) {
  if (!ready()) return;
  posthog.capture(event, props);
}

// Associate subsequent events with a known user. Only non-PII traits.
export function identifyUser(
  id: string,
  traits?: { role?: string; business?: string }
) {
  if (!ready()) return;
  posthog.identify(id, traits);
}

// Clear identity on logout.
export function resetAnalytics() {
  if (!ready()) return;
  posthog.reset();
}
