"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, clearAuth, saveAuth, getToken, type AuthUser } from "@/lib/auth";
import { getBalance } from "@/lib/b2b";
import { apiGet } from "@/lib/api";
import { BrandLogo } from "@/components/BrandLogo";

const NAV = [
  { href: "/business", label: "Overview", exact: true, icon: "◪" },
  { href: "/business/catalog", label: "Catalog", icon: "▤" },
  { href: "/business/branches", label: "Branches", icon: "◎" },
  { href: "/business/try-on", label: "Try-On", icon: "✦" },
  { href: "/business/credits", label: "Credits", icon: "◈" },
  { href: "/business/settings", label: "Settings", icon: "⚙" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "b2b") {
      router.replace("/login");
      return;
    }
    setUser(u);
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready || user?.status === "pending") return;
    const refresh = () =>
      getBalance()
        .then((r) => setCredits(r.balance))
        .catch(() => setCredits(null));
    refresh();
    window.addEventListener("zdc-credits", refresh);
    return () => window.removeEventListener("zdc-credits", refresh);
  }, [ready, user?.status]);

  // Close the drawer on navigation.
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

  const businessName = user.business?.name || "Your Studio";

  function logout() {
    clearAuth();
    router.push("/");
  }

  async function recheckStatus() {
    setChecking(true);
    setCheckMsg("");
    try {
      const token = getToken();
      const r = await apiGet<{ user: AuthUser }>(
        "/api/auth/me",
        token || undefined
      );
      if (token) saveAuth(token, r.user);
      setUser(r.user);
      if (r.user.status === "suspended") {
        setCheckMsg("This account has been suspended. Please contact support.");
      } else if (r.user.status !== "active") {
        setCheckMsg("Still pending. We'll notify you as soon as you're approved.");
      }
    } catch {
      setCheckMsg("Couldn't check right now. Please try again in a moment.");
    } finally {
      setChecking(false);
    }
  }

  // Businesses awaiting Super Admin approval can't use the dashboard yet.
  if (user.status === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="card w-full max-w-md rounded-3xl p-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-sage/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-sage-dark">
            Pending review
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold text-ink">
            Awaiting approval
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Thanks for registering{" "}
            <span className="font-medium text-ink">{businessName}</span>. Your
            business account is pending review. You&apos;ll get full access to
            your studio as soon as a Super Admin approves it.
          </p>
          {checkMsg && (
            <p className="mt-5 rounded-xl border border-ink/10 bg-paper-100 px-4 py-3 text-sm text-ink-muted">
              {checkMsg}
            </p>
          )}
          <button
            onClick={recheckStatus}
            disabled={checking}
            className="mt-6 w-full rounded-full bg-sage py-3 text-sm font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
          >
            {checking ? "Checking…" : "Check approval status"}
          </button>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  function isActive(item: (typeof NAV)[number]) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  const brand = (
    <BrandLogo href="/" size="sm" onDark badge="Business" />
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

  const creditCard = (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-paper/50">
        Credit balance
      </div>
      <div className="mt-1 font-display text-3xl font-semibold text-paper">
        {credits ?? "—"}
      </div>
      <Link
        href="/business/credits"
        className="mt-3 block rounded-full bg-sage px-4 py-2 text-center text-sm font-semibold text-paper transition hover:bg-sage-dark"
      >
        Buy credits
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink/10 bg-ink p-5 md:flex">
        {brand}
        <div className="mt-8">{navLinks}</div>
        <div className="mt-auto">{creditCard}</div>
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
        <div className="mt-4">{creditCard}</div>
        <button
          onClick={logout}
          className="mt-3 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-paper/80 transition hover:border-white/30 hover:text-paper"
        >
          Log out
        </button>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink/10 bg-paper/80 px-4 py-3 backdrop-blur md:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* Hamburger (mobile only) */}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-white/60 text-ink transition hover:border-ink/30 md:hidden"
            >
              <span className="relative block h-3.5 w-4">
                <span className="absolute left-0 top-0 block h-0.5 w-4 rounded-full bg-ink" />
                <span className="absolute left-0 top-1.5 block h-0.5 w-4 rounded-full bg-ink" />
                <span className="absolute left-0 top-3 block h-0.5 w-4 rounded-full bg-ink" />
              </span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage/10 px-3 py-1.5 text-sm font-semibold text-sage-dark">
              <span className="text-xs">◈</span>
              <span className="hidden sm:inline">{credits ?? "—"} credits</span>
              <span className="sm:hidden">{credits ?? "—"}</span>
            </span>
            <button
              onClick={logout}
              className="hidden rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/30 sm:block"
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
