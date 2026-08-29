"use client";

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

type DashboardSidebarProps = {
  brand: ReactNode;
  navLinks: ReactNode;
  footer: ReactNode;
  menuOpen: boolean;
  onClose: () => void;
};

function dup(node: ReactNode, key: string): ReactNode {
  if (isValidElement(node)) {
    return cloneElement(node as ReactElement, { key });
  }
  return node;
}

export function DashboardSidebar({
  brand,
  navLinks,
  footer,
  menuOpen,
  onClose,
}: DashboardSidebarProps) {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-[#16130f] p-5 md:flex">
        {dup(brand, "brand-desktop")}
        <div className="mt-8 flex-1">{dup(navLinks, "nav-desktop")}</div>
        <div className="mt-auto">{dup(footer, "footer-desktop")}</div>
      </aside>

      {menuOpen && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 cursor-default bg-black/55 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82%] flex-col bg-[#16130f] p-5 shadow-2xl transition-transform duration-300 md:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!menuOpen}
      >
        {/* Only mount mobile chrome when open — avoids a 2nd logo fetch on every page. */}
        {menuOpen ? (
          <>
            <div className="flex items-center justify-between">
              {dup(brand, "brand-mobile")}
              <button
                aria-label="Close menu"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-lg text-paper/80 transition hover:text-paper"
              >
                ✕
              </button>
            </div>
            <div className="mt-8 flex-1 overflow-y-auto">{dup(navLinks, "nav-mobile")}</div>
            <div className="mt-4">{dup(footer, "footer-mobile")}</div>
          </>
        ) : null}
      </aside>
    </>
  );
}
