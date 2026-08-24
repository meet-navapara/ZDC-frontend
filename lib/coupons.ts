"use client";

import { apiGet, apiPost } from "./api";
import { getToken } from "./auth";

export type CouponQuote = {
  valid: true;
  coupon: {
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
  };
  subtotal: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
};

export type WelcomeCouponResult =
  | { eligible: false; error?: string }
  | { eligible: true; quote: CouponQuote; autoApplied?: boolean };

export function validateCheckoutCoupon(body: {
  code: string;
  packId: string;
  amount: number;
  currency: string;
}) {
  return apiPost<CouponQuote>("/api/coupons/validate", body, getToken() || undefined);
}

export function fetchWelcomeCoupon(params: {
  packId: string;
  currency: string;
}) {
  const q = new URLSearchParams({
    packId: params.packId,
    currency: params.currency,
  });
  return apiGet<WelcomeCouponResult>(
    `/api/coupons/welcome?${q}`,
    getToken() || undefined
  );
}
