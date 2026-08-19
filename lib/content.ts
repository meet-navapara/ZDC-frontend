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
    badge: "Hair & Apparel Virtual Try-On • Built for You",
    titleLine1: "Hair & Apparel,",
    titleHighlight: "Try-On",
    titleLine2: "in Seconds.",
    subtitle:
      "No guesswork, no regrets — just instant results. See exactly how any outfit or hairstyle looks on you before you buy or book.",
    primaryCta: "Try On Instantly",
    stats: [
      { value: "~8s", label: "Render time" },
      { value: "Hair & Apparel", label: "Categories" },
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
    const res = await fetch(`${API_BASE}/api/content`, { next: { revalidate: 30 } });
    if (!res.ok) return DEFAULT_CONTENT;
    const data = (await res.json()) as { content?: SiteContent };
    return data.content || DEFAULT_CONTENT;
  } catch {
    return DEFAULT_CONTENT;
  }
}
