"use client";

import { apiGet, apiPatch, apiPost, apiDelete, apiPut } from "./api";
import { getToken, type AuthUser } from "./auth";
import type { SiteContent } from "./content";

export type AdminOverview = {
  users: {
    total: number;
    b2c: number;
    b2b: number;
    admins: number;
    pendingB2B: number;
    suspended: number;
  };
  tryons: { total: number; today: number };
};

export type AdminUser = AuthUser & {
  phone?: string;
  createdAt?: string;
};

export type UserListResult = {
  users: AdminUser[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type UserDetail = {
  user: AdminUser;
  stats?: { credits: number; products: number; categories: number; tryons: number };
};

export type UserStatus = "active" | "pending" | "suspended";

function tok() {
  return getToken() || undefined;
}

export function getOverview() {
  return apiGet<{ overview: AdminOverview }>("/api/admin/overview", tok());
}

export function listUsers(params?: {
  role?: string;
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.role) q.set("role", params.role);
  if (params?.status) q.set("status", params.status);
  if (params?.q) q.set("q", params.q);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiGet<UserListResult>(`/api/admin/users${qs ? `?${qs}` : ""}`, tok());
}

export function getUserDetail(id: string) {
  return apiGet<UserDetail>(`/api/admin/users/${id}`, tok());
}

export function setUserStatus(id: string, status: UserStatus) {
  return apiPatch<{ user: AdminUser }>(
    `/api/admin/users/${id}/status`,
    { status },
    tok()
  );
}

export function resetUserPassword(id: string, password: string) {
  return apiPost<{ ok: boolean }>(
    `/api/admin/users/${id}/reset-password`,
    { password },
    tok()
  );
}

export function deleteUser(id: string) {
  return apiDelete<{ ok: boolean }>(`/api/admin/users/${id}`, tok());
}

/* -------------------------------- Audit log ------------------------------- */

export type AuditEntry = {
  id: string;
  actor: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
};

export type AuditResult = {
  logs: AuditEntry[];
  actions: string[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export function listAudit(params?: {
  page?: number;
  limit?: number;
  action?: string;
  q?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.action) qs.set("action", params.action);
  if (params?.q) qs.set("q", params.q);
  const query = qs.toString();
  return apiGet<AuditResult>(`/api/admin/audit${query ? `?${query}` : ""}`, tok());
}

/* -------------------------------- Analytics ------------------------------- */

export type PlatformStats = {
  users: {
    total: number;
    b2c: number;
    b2b: number;
    admins: number;
    pendingB2B: number;
    suspended: number;
    newToday: number;
    new7: number;
    new30: number;
  };
  tryons: {
    total: number;
    today: number;
    last7: number;
    last30: number;
    channel: { b2c: number; b2b: number };
    status: {
      completed: number;
      failed: number;
      processing: number;
      awaiting_payment: number;
    };
    successRate: number;
  };
  revenue: {
    currency: string;
    total: number;
    today: number;
    last7: number;
    last30: number;
    byPurpose: { b2c_tryon: number; b2b_credits: number };
  };
  credits: {
    purchased: number;
    consumed: number;
    refunded: number;
    outstanding: number;
  };
  series: {
    tryons: { date: string; count: number; b2c: number; b2b: number }[];
    revenue: { date: string; amount: number }[];
  };
  topBusinesses: {
    userId: string;
    name: string;
    category?: string;
    tryons: number;
    completed: number;
  }[];
};

export function getAnalytics(days = 30) {
  return apiGet<{ stats: PlatformStats }>(
    `/api/admin/analytics?days=${days}`,
    tok()
  );
}

/* -------------------------------- Payments -------------------------------- */

export type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  gateway: string;
  purpose: string;
  reference: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    role: string;
    businessName: string | null;
  } | null;
};

export type CurrencyAmount = { count: number; amount: number };

export type StatusCurrencySummary = {
  kes: CurrencyAmount;
  inr: CurrencyAmount;
  totalCount: number;
};

export type PaymentSummary = {
  paid: StatusCurrencySummary;
  pending: StatusCurrencySummary;
  failed: StatusCurrencySummary;
  cancelled?: StatusCurrencySummary;
  refunded?: StatusCurrencySummary;
  byCurrency?: {
    KES: Record<string, CurrencyAmount>;
    INR: Record<string, CurrencyAmount>;
  };
};

function emptyBucket(): CurrencyAmount {
  return { count: 0, amount: 0 };
}

function emptyStatusSummary(): StatusCurrencySummary {
  return { kes: emptyBucket(), inr: emptyBucket(), totalCount: 0 };
}

/** Accept new `{ paid: { kes, inr } }` or legacy `{ paid: { count, amount }, currency }`. */
export function normalizePaymentSummary(raw: unknown): PaymentSummary {
  const s = raw as Record<string, unknown> | null | undefined;
  if (!s) {
    return {
      paid: emptyStatusSummary(),
      pending: emptyStatusSummary(),
      failed: emptyStatusSummary(),
    };
  }

  const paid = s.paid as Record<string, unknown> | undefined;
  if (paid && typeof paid.kes === "object" && typeof paid.inr === "object") {
    return raw as PaymentSummary;
  }

  function fromLegacy(key: string): StatusCurrencySummary {
    const bucket = (s![key] as CurrencyAmount | undefined) || emptyBucket();
    const cur = String(s!.currency || "KES").toUpperCase();
    const kes = cur === "INR" ? emptyBucket() : { ...bucket };
    const inr = cur === "INR" ? { ...bucket } : emptyBucket();
    return { kes, inr, totalCount: bucket.count };
  }

  return {
    paid: fromLegacy("paid"),
    pending: fromLegacy("pending"),
    failed: fromLegacy("failed"),
    cancelled: fromLegacy("cancelled"),
    refunded: fromLegacy("refunded"),
  };
}

export type PaymentResult = {
  payments: PaymentRow[];
  summary: PaymentSummary;
  statuses: string[];
  gateways: string[];
  purposes: string[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export function listPayments(params?: {
  page?: number;
  limit?: number;
  status?: string;
  gateway?: string;
  purpose?: string;
  q?: string;
  days?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);
  if (params?.gateway) qs.set("gateway", params.gateway);
  if (params?.purpose) qs.set("purpose", params.purpose);
  if (params?.q) qs.set("q", params.q);
  if (params?.days) qs.set("days", String(params.days));
  const query = qs.toString();
  return apiGet<PaymentResult>(`/api/admin/payments${query ? `?${query}` : ""}`, tok()).then(
    (r) => ({ ...r, summary: normalizePaymentSummary(r.summary) })
  );
}

export function refundPayment(id: string, body?: { reason?: string; reverseCredits?: boolean }) {
  return apiPost<{
    payment: {
      id: string;
      status: string;
      amount: number;
      currency: string;
      gateway?: string;
      purpose?: string;
      reference?: string | null;
    };
  }>(`/api/admin/payments/${id}/refund`, body || {}, tok());
}

/* ---------------------------- Catalogue oversight ------------------------- */

export type CatalogUploader = {
  id: string;
  email: string | null;
  name: string;
  ownerName: string | null;
  businessName: string | null;
  category: string | null;
  productCount: number;
  activeCount: number;
  archivedCount: number;
  lastUploadAt: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  currency: string;
  status: "active" | "archived";
  imageCount: number;
  thumbnail: string | null;
  category: string | null;
  createdAt: string;
  business: {
    id: string;
    email: string;
    name: string | null;
    ownerName?: string | null;
    category?: string | null;
    currency?: string | null;
    phone?: string | null;
  } | null;
};

export type CatalogResult = {
  products: CatalogProduct[];
  uploaders: CatalogUploader[];
  summary: { total: number; active: number; archived: number; businesses: number };
  statuses: string[];
  page: number;
  limit: number;
  pages: number;
};

export function listCatalog(params?: {
  page?: number;
  limit?: number;
  status?: string;
  business?: string;
  q?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);
  if (params?.business) qs.set("business", params.business);
  if (params?.q) qs.set("q", params.q);
  const query = qs.toString();
  return apiGet<CatalogResult>(`/api/admin/catalog${query ? `?${query}` : ""}`, tok());
}

/* --------------------------------- Pricing -------------------------------- */

export type B2cPack = {
  id: string;
  label: string;
  images: number;
  amount: number;
  currency: string;
  amountInr?: number | null;
};

export type CreditPack = {
  id: string;
  label: string;
  credits: number;
  amount: number;
  currency: string;
  amountInr?: number | null;
};

export type PricingConfig = {
  b2cPacks: B2cPack[];
  creditPacks: CreditPack[];
  updatedAt?: string;
};

export function getPricing() {
  return apiGet<{ pricing: PricingConfig }>("/api/admin/pricing", tok());
}

export function updatePricing(body: {
  b2cPacks: B2cPack[];
  creditPacks: CreditPack[];
}) {
  return apiPut<{ pricing: PricingConfig }>("/api/admin/pricing", body, tok());
}

/* ------------------------------ Site content ------------------------------ */

export function getContent() {
  return apiGet<{ content: SiteContent }>("/api/admin/content", tok());
}

export function updateContent(body: SiteContent) {
  return apiPut<{ content: SiteContent }>("/api/admin/content", body, tok());
}

/* -------------------------------- Coupons -------------------------------- */

export type CouponDiscountType = "percentage" | "fixed";
export type CouponScope = "all" | "selected";
export type CouponStatus = "active" | "inactive" | "expired";

export type AdminCoupon = {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountValueInr: number | null;
  scope: CouponScope;
  packIds: string[];
  minimumPurchase: number | null;
  minimumPurchaseInr: number | null;
  maximumDiscount: number | null;
  maximumDiscountInr: number | null;
  usageLimit: number | null;
  usageCount: number;
  reservedCount?: number;
  perUserLimit: number | null;
  newUserOnly?: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  status: CouponStatus;
  createdAt: string;
  totalDiscountKes: number;
  totalDiscountInr: number;
  discountByCurrency?: { currency: string; amount: number; uses: number }[];
};

export type CouponStats = {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalUses: number;
  discountByCurrency: { currency: string; amount: number; uses: number }[];
};

export type CouponListResult = {
  coupons: AdminCoupon[];
  page: number;
  limit: number;
  total: number;
  pages: number;
  stats: CouponStats;
};

export type CouponPayload = {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountValueInr?: number | null;
  scope: CouponScope;
  packIds?: string[];
  minimumPurchase?: number | null;
  minimumPurchaseInr?: number | null;
  maximumDiscount?: number | null;
  maximumDiscountInr?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  newUserOnly?: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
};

export function listCoupons(params?: {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.q) q.set("q", params.q);
  if (params?.status) q.set("status", params.status);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiGet<CouponListResult>(`/api/admin/coupons${qs ? `?${qs}` : ""}`, tok());
}

export function getCoupon(id: string) {
  return apiGet<{ coupon: AdminCoupon }>(`/api/admin/coupons/${id}`, tok());
}

export function createCoupon(body: CouponPayload) {
  return apiPost<{ coupon: AdminCoupon }>("/api/admin/coupons", body, tok());
}

export function updateCoupon(id: string, body: CouponPayload) {
  return apiPatch<{ coupon: AdminCoupon }>(`/api/admin/coupons/${id}`, body, tok());
}

export function enableCoupon(id: string) {
  return apiPost<{ coupon: AdminCoupon }>(`/api/admin/coupons/${id}/enable`, {}, tok());
}

export function disableCoupon(id: string) {
  return apiPost<{ coupon: AdminCoupon }>(`/api/admin/coupons/${id}/disable`, {}, tok());
}

export function deleteCoupon(id: string) {
  return apiDelete<{ ok: boolean; softDeleted?: boolean; message?: string }>(
    `/api/admin/coupons/${id}`,
    tok()
  );
}
