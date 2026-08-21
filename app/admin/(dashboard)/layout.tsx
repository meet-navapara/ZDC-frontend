"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, clearAuth, type AuthUser } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { toast } from "@/lib/toast";

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
    toast.success("Signed out");
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

  const sidebarFooter = (
    <button
      onClick={logout}
      className="w-full rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-paper/80 transition hover:border-white/30 hover:text-paper"
    >
      Log out
    </button>
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

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink/10 bg-paper px-4 py-3 dark:border-white/10 dark:bg-[#100e0b] md:px-5">
          <div className="flex items-center gap-2.5">
            {/* Hamburger (mobile only) */}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-white/60 text-ink transition hover:border-ink/30 dark:border-white/10 dark:bg-white/5 dark:text-[#f4efe7] dark:hover:border-white/20 md:hidden"
            >
              <span className="relative block h-3.5 w-4">
                <span className="absolute left-0 top-0 block h-0.5 w-4 rounded-full bg-current" />
                <span className="absolute left-0 top-1.5 block h-0.5 w-4 rounded-full bg-current" />
                <span className="absolute left-0 top-3 block h-0.5 w-4 rounded-full bg-current" />
              </span>
            </button>
            <div className="font-display text-lg font-semibold text-ink dark:text-[#f4efe7]">
              Super Admin
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <span className="hidden text-xs text-ink-muted dark:text-[#b1a99c] sm:inline">
              {user.email}
            </span>
            <button
              onClick={logout}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/30 dark:border-white/15 dark:text-[#f4efe7] dark:hover:border-white/30 md:hidden"
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
