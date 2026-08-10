"use client";

import { useRef } from "react";

type SpotlightProps = {
  children: React.ReactNode;
  className?: string;
};

export function Spotlight({ children, className = "" }: SpotlightProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} onMouseMove={handleMove} className={`spotlight ${className}`}>
      {children}
    </div>
  );
}
