import { API_BASE } from "./api";
import type { B2cPack } from "./b2c";

export type CreditPackPublic = {
  id: string;
  label: string;
  credits: number;
  amount: number;
  currency: string;
  amountKes?: number;
  amountInr?: number;
};

export type PublicPricing = {
  packs: B2cPack[];
  creditPacks?: CreditPackPublic[];
};

const FALLBACK: PublicPricing = {
  packs: [
    {
      id: "single",
      label: "Single",
      images: 1,
      amount: 20,
      currency: "KES",
      amountKes: 20,
      amountInr: 49,
    },
    {
      id: "trio",
      label: "Trio",
      images: 3,
      amount: 50,
      currency: "KES",
      amountKes: 50,
      amountInr: 99,
    },
  ],
  creditPacks: [
    {
      id: "starter",
      label: "Starter",
      credits: 50,
      amount: 750,
      currency: "KES",
      amountKes: 750,
      amountInr: 499,
    },
  ],
};

/** Server-side fetch for landing page pricing (dual KES + INR). */
export async function getPublicPricing(): Promise<PublicPricing> {
  try {
    const res = await fetch(`${API_BASE}/api/tryon/pricing`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as PublicPricing;
    return {
      packs: data.packs?.length ? data.packs : FALLBACK.packs,
      creditPacks: data.creditPacks?.length ? data.creditPacks : FALLBACK.creditPacks,
    };
  } catch {
    return FALLBACK;
  }
}

export function formatDualPrice(pack: {
  amountKes?: number;
  amountInr?: number;
  amount?: number;
  currency?: string;
}) {
  const kes = pack.amountKes ?? (pack.currency === "KES" ? pack.amount : undefined);
  const inr = pack.amountInr;
  if (kes != null && inr != null) {
    return { primary: `KES ${kes}`, secondary: `₹${inr}` };
  }
  const cur = pack.currency || "KES";
  const amt = pack.amount ?? 0;
  return { primary: `${cur} ${amt}`, secondary: null };
}
