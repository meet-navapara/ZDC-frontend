"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import B2cTryOnStudio from "@/components/B2cTryOnStudio";
import { getUser, homeForRole } from "@/lib/auth";

/**
 * Public try-on studio. Logged-in consumers are sent to the dashboard studio.
 */
export default function PublicTryOnPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    if (user.role === "b2c") {
      router.replace("/app/try-on");
      return;
    }
    router.replace(homeForRole(user.role));
  }, [router]);

  return (
    <main className="min-h-screen bg-paper">
      <AppHeader />
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
        <h1 className="font-display text-3xl font-semibold text-ink">Try-On</h1>
        <p className="mt-1 text-ink-muted">
          Upload a selfie, pick a pack, and get styled results in seconds.
        </p>
        <div className="mt-8">
          <B2cTryOnStudio />
        </div>
      </div>
    </main>
  );
}
