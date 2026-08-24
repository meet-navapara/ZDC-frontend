"use client";

import { apiPost } from "./api";
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

export function validateCheckoutCoupon(body: {
  code: string;
  packId: string;
  amount: number;
  currency: string;
}) {
  return apiPost<CouponQuote>("/api/coupons/validate", body, getToken() || undefined);
}
