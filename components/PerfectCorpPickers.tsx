"use client";

import { useState } from "react";
import { apiUrl } from "@/lib/api";

export type HairColorOption = {
  name: string;
  swatch: { primary: string; secondary?: string };
};

export type BeardTemplateOption = {
  id: string;
  title: string;
  thumb: string | null;
  category?: string;
};

function beardPreviewSrc(url: string | null | undefined) {
  if (!url) return null;
  if (/res\.cloudinary\.com/i.test(url)) return url;
  return apiUrl(
    `/api/tryon/perfectcorp/thumbnail?url=${encodeURIComponent(url)}`
  );
}

function BeardStyleCard({
  template,
  selected,
  onSelect,
}: {
  template: BeardTemplateOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const src = beardPreviewSrc(template.thumb);
  const showImage = Boolean(src) && !failed;

  return (
    <button
      type="button"
      onClick={onSelect}
      title={template.title}
      className={`overflow-hidden rounded-xl border text-left transition ${
        selected
          ? "border-sage bg-sage/10 ring-2 ring-sage/30"
          : "border-ink/10 hover:border-sage/40"
      }`}
    >
      <div className="relative aspect-[4/5] bg-gradient-to-b from-[#e8e4dc] to-[#cfc7bc] dark:from-[#2a2724] dark:to-[#1a1816]">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src!}
            alt={template.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-2 text-center">
            <svg
              className="h-10 w-10 text-ink/35"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              <path d="M9 14c.8 1.2 2.2 2 4 2s3.2-.8 4-2" />
            </svg>
            <span className="text-[11px] font-semibold leading-tight text-ink">
              {template.title}
            </span>
          </div>
        )}
        {showImage && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2 pb-2 pt-8">
            <span className="line-clamp-2 text-[10px] font-semibold text-paper">
              {template.title}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

export function HairColorPicker({
  options,
  value,
  onChange,
  label,
}: {
  options: HairColorOption[];
  value: string;
  onChange: (name: string) => void;
  label?: string;
}) {
  return (
    <div>
      {label && (
        <p className="mb-2 text-xs font-semibold text-ink-muted">{label}</p>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {options.map((opt) => {
          const selected = value === opt.name;
          const bg =
            opt.swatch.secondary != null
              ? `linear-gradient(135deg, ${opt.swatch.primary} 50%, ${opt.swatch.secondary} 50%)`
              : opt.swatch.primary;
          return (
            <button
              key={opt.name}
              type="button"
              onClick={() => onChange(opt.name)}
              title={opt.name}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition ${
                selected
                  ? "border-sage bg-sage/10 ring-2 ring-sage/30"
                  : "border-ink/10 hover:border-sage/40"
              }`}
            >
              <span
                className="h-10 w-10 shrink-0 rounded-full border border-ink/10 shadow-inner"
                style={{ background: bg }}
              />
              <span className="line-clamp-2 text-[10px] font-medium leading-tight text-ink">
                {opt.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BeardStylePicker({
  templates,
  value,
  onChange,
  label,
}: {
  templates: BeardTemplateOption[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  return (
    <div>
      {label && (
        <p className="mb-2 text-xs font-semibold text-ink-muted">{label}</p>
      )}
      <p className="mb-3 text-xs text-ink-muted">
        Tap a style to see how it looks on your selfie.
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {templates.map((t) => (
          <BeardStyleCard
            key={t.id}
            template={t}
            selected={value === t.id}
            onSelect={() => onChange(t.id)}
          />
        ))}
      </div>
    </div>
  );
}
