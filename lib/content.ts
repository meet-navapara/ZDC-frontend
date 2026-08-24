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
    badge: "AI Virtual Try-On · Outfits, Hair & Beard",
    titleLine1: "AI Virtual",
    titleHighlight: "Try-On",
    titleLine2: "for outfits & hair.",
    subtitle:
      "Upload a selfie and preview photorealistic outfits, hairstyles, hair color, or beard looks in seconds — try before you buy or book, with M-Pesa and Razorpay.",
    primaryCta: "Start AI Try-On",
    stats: [
      { value: "~8s", label: "AI render time" },
      { value: "Outfit · Hair", label: "Try-on styles" },
      { value: "M-Pesa · UPI", label: "Easy payments" },
    ],
  },
  testimonials: [],
  pricingNote:
    "Pay per look with M-Pesa (KES) or Razorpay (INR). Pricing shown for illustration and may be updated by admin.",
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
