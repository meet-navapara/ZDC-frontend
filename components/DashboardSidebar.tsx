"use client";

import type { ReactNode } from "react";

type DashboardSidebarProps = {
  brand: ReactNode;
  navLinks: ReactNode;
  footer: ReactNode;
  menuOpen: boolean;
  onClose: () => void;
};

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
        {brand}
        <div className="mt-8 flex-1">{navLinks}</div>
        <div className="mt-auto">{footer}</div>
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
      >
        <div className="flex items-center justify-between">
          {brand}
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-lg text-paper/80 transition hover:text-paper"
          >
            ✕
          </button>
        </div>
        <div className="mt-8 flex-1 overflow-y-auto">{navLinks}</div>
        <div className="mt-4">{footer}</div>
      </aside>
    </>
  );
}
