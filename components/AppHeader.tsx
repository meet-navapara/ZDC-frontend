"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, clearAuth, type AuthUser } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { toast } from "@/lib/toast";

export function AppHeader() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const sync = () => setUser(getUser());
    sync();
    window.addEventListener("zdc-auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("zdc-auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const logout = () => {
    clearAuth();
    toast.success("Signed out");
    setOpen(false);
    router.push("/");
  };

  const accountHref =
    user?.role === "b2c"
      ? "/app"
      : user?.role === "b2b"
        ? "/business"
        : user?.role === "admin"
          ? "/admin"
          : "/login";

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 sm:px-4">
      <div className="mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-full glass px-3 py-2.5 sm:mt-4 sm:px-5 sm:py-3">
        <div onClick={() => setOpen(false)}>
          <BrandLogo size="md" href={user ? accountHref : "/"} />
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 text-sm md:flex">
          <DarkModeToggle />
          {user?.role === "b2c" && (
            <Link
              href="/app/try-on"
              className="font-medium text-ink-muted transition hover:text-ink dark:text-[#b1a99c] dark:hover:text-[#f4efe7]"
            >
              Try On
            </Link>
          )}
          {user ? (
            <>
              <Link
                href={accountHref}
                className="max-w-[160px] truncate font-medium text-ink transition hover:text-sage-dark dark:text-[#e8e2d8] dark:hover:text-sage lg:max-w-none"
              >
                {user.email}
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-ink/15 px-4 py-2 font-semibold text-ink transition hover:border-ink/30 dark:border-white/15 dark:text-[#e8e2d8] dark:hover:border-white/30"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-medium text-ink-muted transition hover:text-ink dark:text-[#9a9387] dark:hover:text-[#e8e2d8]"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-sage px-4 py-2 font-semibold text-paper transition hover:bg-sage-dark"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile: primary CTA + menu */}
        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <Link
              href={accountHref}
              className="rounded-full bg-sage px-3.5 py-2 text-xs font-semibold text-paper transition hover:bg-sage-dark"
              onClick={() => setOpen(false)}
            >
              Account
            </Link>
          ) : (
            <Link
              href="/register"
              className="rounded-full bg-sage px-3.5 py-2 text-xs font-semibold text-paper transition hover:bg-sage-dark"
              onClick={() => setOpen(false)}
            >
              Sign up
            </Link>
          )}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white/60 text-ink transition hover:border-ink/25 dark:border-white/10 dark:bg-white/5 dark:text-[#f4efe7]"
          >
            <span className="relative block h-3.5 w-4">
              <span
                className={`absolute left-0 block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-4 rounded-full bg-current transition-all duration-200 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-ink/20 backdrop-blur-sm md:hidden"
          />
          <div className="relative z-50 mx-auto mt-2 max-w-6xl md:hidden">
            <div className="glass-strong rounded-3xl p-4">
              <nav className="flex flex-col gap-1">
                {user?.role === "b2c" && (
                  <Link
                    href="/app"
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-base font-medium text-ink hover:bg-white/60 dark:text-[#f4efe7] dark:hover:bg-white/5"
                  >
                    My dashboard
                  </Link>
                )}
                {user?.role === "b2b" && (
                  <Link
                    href="/business"
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-base font-medium text-ink hover:bg-white/60 dark:text-[#f4efe7] dark:hover:bg-white/5"
                  >
                    My dashboard
                  </Link>
                )}
                {user ? (
                  <>
                    <p className="truncate px-4 py-2 text-sm text-ink-muted dark:text-[#b1a99c]">
                      {user.email}
                    </p>
                    <button
                      onClick={logout}
                      className="rounded-xl px-4 py-3 text-left text-base font-medium text-ink hover:bg-white/60 dark:text-[#f4efe7] dark:hover:bg-white/5"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-3 border-t border-ink/10 pt-4">
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                    className="rounded-full border border-ink/15 py-2.5 text-center text-sm font-semibold text-ink dark:border-white/15 dark:text-[#f4efe7]"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="rounded-full bg-sage py-2.5 text-center text-sm font-semibold text-paper"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
