"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, homeForRole } from "@/lib/auth";

/**
 * /try-on is login-gated. Guests go to login with ?next= so they return
 * to the studio after signing in.
 */
export default function TryOnRedirectPage() {
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

  return null;
}
