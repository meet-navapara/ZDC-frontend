"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, homeForRole } from "@/lib/auth";

/**
 * Public /try-on is gated: guests → login, logged-in consumers → dashboard studio.
 */
export default function TryOnGatePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login?next=/app/try-on");
      return;
    }
    if (user.role === "b2c") {
      router.replace("/app/try-on");
      return;
    }
    router.replace(homeForRole(user.role));
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
    </div>
  );
}
