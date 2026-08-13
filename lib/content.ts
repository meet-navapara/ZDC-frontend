import { API_BASE } from "./api";

export type HeroStat = { value: string; label: string };
export type Testimonial = { quote: string; author: string; role: string };

export type SiteContent = {
  hero: {
    badge: string;
    titleLine1: string;
    titleHighlight: string;
    titleLine2: string;
    subtitle: string;
    primaryCta: string;
    stats: HeroStat[];
  };
  testimonials: Testimonial[];
  pricingNote: string;
};

// Mirrors the backend defaults so the landing page renders correctly even if the
// API is unreachable at request time.
export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    badge: "AI Virtual Try-On • Built for Africa",
    titleLine1: "Wear the",
    titleHighlight: "Future.",
    titleLine2: "Now.",
    subtitle:
      "Visualize any outfit or hairstyle on yourself before you spend a shilling. Photorealistic try-ons, delivered in seconds.",
    primaryCta: "Try On Instantly",
    stats: [
      { value: "~8s", label: "Render time" },
      { value: "WhatsApp", label: "Instant delivery" },
      { value: "M-Pesa", label: "Easy payments" },
    ],
  },
  testimonials: [],
  pricingNote:
    "Payments via M-Pesa. Final pricing configurable — shown for illustration.",
};

// Server-side fetch for the marketing page. Never throws — falls back to
// defaults so the homepage always renders.
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const res = await fetch(`${API_BASE}/api/content`, { cache: "no-store" });
    if (!res.ok) return DEFAULT_CONTENT;
    const data = (await res.json()) as { content?: SiteContent };
    return data.content || DEFAULT_CONTENT;
  } catch {
    return DEFAULT_CONTENT;
  }
}
