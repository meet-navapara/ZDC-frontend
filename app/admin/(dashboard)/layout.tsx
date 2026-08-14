"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, clearAuth, type AuthUser } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";

const NAV = [
  { href: "/admin", label: "Overview", exact: true, icon: "◪" },
  { href: "/admin/analytics", label: "Analytics", icon: "◨" },
  { href: "/admin/users", label: "Users", icon: "◧" },
  { href: "/admin/catalog", label: "Catalogue", icon: "▦" },
  { href: "/admin/payments", label: "Payments", icon: "▤" },
  { href: "/admin/pricing", label: "Pricing", icon: "◈" },
  { href: "/admin/content", label: "Content", icon: "✎" },
  { href: "/admin/audit", label: "Audit log", icon: "◊" },
];

export default function AdminLayout({
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
    if (!u || u.role !== "admin") {
      router.replace("/admin/login");
      return;
    }
    setUser(u);
    setReady(true);
  }, [router]);

  // Close the drawer on route change.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
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

  function logout() {
    clearAuth();
    router.push("/admin/login");
  }

  function isActive(item: (typeof NAV)[number]) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  const brand = (
    <BrandLogo href="/admin" size="sm" onDark badge="HQ" />
  );

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

  return (
    <div className="min-h-screen bg-paper md:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink/10 bg-ink p-5 md:flex">
        {brand}
        <div className="mt-8">{navLinks}</div>
        <button
          onClick={logout}
          className="mt-auto rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-paper/80 transition hover:border-white/30 hover:text-paper"
        >
          Log out
        </button>
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-ink/40 backdrop-blur-sm md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82%] flex-col bg-ink p-5 shadow-2xl transition-transform duration-300 md:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          {brand}
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-lg text-paper/80 transition hover:text-paper"
          >
            ✕
          </button>
        </div>
        <div className="mt-8 flex-1 overflow-y-auto">{navLinks}</div>
        <button
          onClick={logout}
          className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-paper/80 transition hover:border-white/30 hover:text-paper"
        >
          Log out
        </button>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink/10 bg-paper/80 px-4 py-3 backdrop-blur md:px-5">
          <div className="flex items-center gap-2.5">
            {/* Hamburger (mobile only) */}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-white/60 text-ink transition hover:border-ink/30 md:hidden"
            >
              <span className="relative block h-3.5 w-4">
                <span className="absolute left-0 top-0 block h-0.5 w-4 rounded-full bg-ink" />
                <span className="absolute left-0 top-1.5 block h-0.5 w-4 rounded-full bg-ink" />
                <span className="absolute left-0 top-3 block h-0.5 w-4 rounded-full bg-ink" />
              </span>
            </button>
            <div className="font-display text-lg font-semibold text-ink">
              Super Admin
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-ink-muted sm:inline">
              {user.email}
            </span>
            <button
              onClick={logout}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/30 md:hidden"
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
