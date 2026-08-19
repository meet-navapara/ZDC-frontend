import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "ngrok-skip-browser-warning", value: "true" },
        ],
      },
    ];
  },
};

// Warn early on Vercel if the API base URL was forgotten — otherwise the
// browser tries localhost and every request fails silently in production.
if (process.env.VERCEL && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn(
    "[zimji] NEXT_PUBLIC_API_BASE_URL is not set. Set it in Vercel → Settings → Environment Variables to your backend URL (e.g. https://zimji-api.onrender.com)."
  );
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
});
