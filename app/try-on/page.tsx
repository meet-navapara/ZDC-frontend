"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, homeForRole } from "@/lib/auth";

/**
 * /try-on is now login-gated. Redirect guests to login,
 * logged-in b2c to their dashboard studio.
 */
export default function TryOnRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login");
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
