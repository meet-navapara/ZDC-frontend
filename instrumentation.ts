import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Next.js attaches abort/close listeners to ServerResponse for each
    // in-flight fetch. Under concurrent SSR requests the default limit of 10
    // is exceeded. Raising it to 50 silences the spurious warning without
    // hiding real leaks (genuine leaks accumulate in the thousands).
    const { EventEmitter } = await import("events");
    EventEmitter.defaultMaxListeners = 50;

    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
