"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, clearAuth, type AuthUser, homeForRole } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const NAV = [
  { href: "/app", label: "Overview", exact: true, icon: "◪" },
  { href: "/app/try-on", label: "Try-On", icon: "✦" },
  { href: "/app/history", label: "History", icon: "▤" },
  { href: "/app/payments", label: "Payments", icon: "◈" },
  { href: "/app/referrals", label: "Referrals", icon: "◎" },
  { href: "/app/settings", label: "Settings", icon: "⚙" },
];

export default function ConsumerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      const next = pathname?.startsWith("/app") ? pathname : "/app";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (u.role === "b2b") {
      router.replace("/business");
      return;
    }
    if (u.role === "admin") {
      router.replace("/admin");
      return;
    }
    if (u.role !== "b2c") {
      router.replace(homeForRole(u.role));
      return;
    }
    setUser(u);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
      </div>
    );
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  function logout() {
    clearAuth();
    router.push("/");
  }

  function isActive(item: (typeof NAV)[number]) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  const brand = <BrandLogo href="/app" size="sm" onDark badge="Personal" />;

  const navLinks = (
    <nav className="space-y-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            isActive(item)
              ? "bg-sage text-paper"
              : "text-paper/60 hover:bg-white/5 hover:text-paper"
          }`}
        >
          <span className="text-base leading-none">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const ctaCard = (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-paper/50">
        Ready to style?
      </div>
      <p className="mt-1 text-sm text-paper/70">
        Upload a selfie and try a new look in seconds.
      </p>
      <Link
        href="/app/try-on"
        className="mt-3 block rounded-full bg-sage px-4 py-2 text-center text-sm font-semibold text-paper transition hover:bg-sage-dark"
      >
        New try-on
      </Link>
    </div>
  );

  const sidebarFooter = (
    <div className="space-y-3">
      {ctaCard}
      <button
        onClick={logout}
        className="w-full rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-paper/80 transition hover:border-white/30 hover:text-paper"
      >
        Log out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-[#0c0b09] dark:text-[#f4efe7] md:flex">
      <DashboardSidebar
        brand={brand}
        navLinks={navLinks}
        footer={sidebarFooter}
        menuOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink/10 bg-paper px-4 py-3 dark:border-white/10 dark:bg-[#0c0b09] md:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-white/60 text-ink transition hover:border-ink/30 dark:border-white/10 dark:bg-white/5 dark:text-[#f4efe7] dark:hover:border-white/20 md:hidden"
            >
              <span className="relative block h-3.5 w-4">
                <span className="absolute left-0 top-0 block h-0.5 w-4 rounded-full bg-current" />
                <span className="absolute left-0 top-1.5 block h-0.5 w-4 rounded-full bg-current" />
                <span className="absolute left-0 top-3 block h-0.5 w-4 rounded-full bg-current" />
              </span>
            </button>
            <span className="truncate text-sm font-medium text-ink-muted md:hidden">
              {displayName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <span className="hidden max-w-[220px] truncate text-sm text-ink-muted sm:inline">
              {user.email}
            </span>
            <Link
              href="/app/try-on"
              className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-paper transition hover:bg-sage-dark"
            >
              Try on
            </Link>
            <button
              onClick={logout}
              className="hidden rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/30 dark:border-white/15 dark:text-[#f4efe7] dark:hover:border-white/30 sm:block"
            >
              Log out
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
