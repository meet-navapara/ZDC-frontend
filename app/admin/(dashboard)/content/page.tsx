"use client";

import { useEffect, useState } from "react";
import { getContent, updateContent } from "@/lib/admin";
import type { SiteContent } from "@/lib/content";
import { toast } from "@/lib/toast";
import { PageLoader } from "@/components/PageLoader";

const input =
  "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-sage";
const labelCls =
  "mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-muted";

function Field({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {textarea ? (
        <textarea
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={input}
        />
      ) : (
        <input
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={input}
        />
      )}
    </label>
  );
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-6">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      {desc && <p className="mt-1 text-sm text-ink-muted">{desc}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function AdminContentPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContent()
      .then((r) => setContent(r.content))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  function patchHero<K extends keyof SiteContent["hero"]>(
    key: K,
    value: SiteContent["hero"][K]
  ) {
    setContent((c) => (c ? { ...c, hero: { ...c.hero, [key]: value } } : c));
    setSaved(false);
  }

  function patchStat(i: number, key: "value" | "label", value: string) {
    setContent((c) => {
      if (!c) return c;
      const stats = c.hero.stats.map((s, idx) =>
        idx === i ? { ...s, [key]: value } : s
      );
      return { ...c, hero: { ...c.hero, stats } };
    });
    setSaved(false);
  }

  function patchTestimonial(
    i: number,
    key: "quote" | "author" | "role",
    value: string
  ) {
    setContent((c) => {
      if (!c) return c;
      const testimonials = c.testimonials.map((t, idx) =>
        idx === i ? { ...t, [key]: value } : t
      );
      return { ...c, testimonials };
    });
    setSaved(false);
  }

  function addTestimonial() {
    setContent((c) =>
      c
        ? {
            ...c,
            testimonials: [...c.testimonials, { quote: "", author: "", role: "" }],
          }
        : c
    );
    setSaved(false);
  }

  function removeTestimonial(i: number) {
    setContent((c) =>
      c ? { ...c, testimonials: c.testimonials.filter((_, idx) => idx !== i) } : c
    );
    setSaved(false);
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    setError(null);
    try {
      // Drop empty testimonials so the public section stays clean.
      const cleaned: SiteContent = {
        ...content,
        testimonials: content.testimonials.filter(
          (t) => t.quote.trim() && t.author.trim()
        ),
      };
      const r = await updateContent(cleaned);
      setContent(r.content);
      setSaved(true);
      toast.success("Content saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageLoader label="Loading content…" />;
  }

  if (!content) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
        {error || "Could not load site content."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="space-y-6">
        <Card title="Hero" desc="The headline area at the top of the homepage.">
          <Field
            label="Badge"
            value={content.hero.badge}
            onChange={(v) => patchHero("badge", v)}
            maxLength={120}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Title line 1"
              value={content.hero.titleLine1}
              onChange={(v) => patchHero("titleLine1", v)}
              maxLength={60}
            />
            <Field
              label="Highlighted word"
              value={content.hero.titleHighlight}
              onChange={(v) => patchHero("titleHighlight", v)}
              maxLength={60}
            />
            <Field
              label="Title line 2"
              value={content.hero.titleLine2}
              onChange={(v) => patchHero("titleLine2", v)}
              maxLength={60}
            />
          </div>
          <Field
            label="Subtitle"
            value={content.hero.subtitle}
            onChange={(v) => patchHero("subtitle", v)}
            maxLength={400}
            textarea
          />
          <Field
            label="Primary button label"
            value={content.hero.primaryCta}
            onChange={(v) => patchHero("primaryCta", v)}
            maxLength={40}
          />
        </Card>

        <Card
          title="Hero stats"
          desc="Up to three quick stats shown beneath the hero."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {content.hero.stats.map((s, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-ink/10 p-3">
                <Field
                  label="Value"
                  value={s.value}
                  onChange={(v) => patchStat(i, "value", v)}
                  maxLength={24}
                />
                <Field
                  label="Label"
                  value={s.label}
                  onChange={(v) => patchStat(i, "label", v)}
                  maxLength={40}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Testimonials"
          desc="Optional. If empty, no testimonials section is shown on the homepage."
        >
          {content.testimonials.length === 0 && (
            <p className="text-sm text-ink-muted">No testimonials yet.</p>
          )}
          <div className="space-y-4">
            {content.testimonials.map((t, i) => (
              <div
                key={i}
                className="space-y-3 rounded-xl border border-ink/10 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Testimonial {i + 1}
                  </span>
                  <button
                    onClick={() => removeTestimonial(i)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <Field
                  label="Quote"
                  value={t.quote}
                  onChange={(v) => patchTestimonial(i, "quote", v)}
                  maxLength={500}
                  textarea
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Author"
                    value={t.author}
                    onChange={(v) => patchTestimonial(i, "author", v)}
                    maxLength={120}
                  />
                  <Field
                    label="Role / company"
                    value={t.role}
                    onChange={(v) => patchTestimonial(i, "role", v)}
                    maxLength={120}
                  />
                </div>
              </div>
            ))}
          </div>
          {content.testimonials.length < 12 && (
            <button
              onClick={addTestimonial}
              className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-paper-100"
            >
              + Add testimonial
            </button>
          )}
        </Card>

        <Card title="Pricing" desc="The small print under the pricing section.">
          <Field
            label="Pricing note"
            value={content.pricingNote}
            onChange={(v) => {
              setContent((c) => (c ? { ...c, pricingNote: v } : c));
              setSaved(false);
            }}
            maxLength={300}
            textarea
          />
        </Card>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col-reverse items-stretch gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-end">
        {saved && (
          <span className="text-center text-sm font-medium text-sage-dark sm:mr-auto sm:text-left">
            Saved. The landing page is updated.
          </span>
        )}
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-sage px-8 py-3 text-sm font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
