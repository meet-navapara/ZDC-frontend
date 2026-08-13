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
  status: "pending" | "paid" | "failed";
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

export type PaymentSummary = {
  currency: string;
  paid: { count: number; amount: number };
  pending: { count: number; amount: number };
  failed: { count: number; amount: number };
};

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
  return apiGet<PaymentResult>(`/api/admin/payments${query ? `?${query}` : ""}`, tok());
}

/* ---------------------------- Catalogue oversight ------------------------- */

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
  business: { id: string; email: string; name: string | null } | null;
};

export type CatalogResult = {
  products: CatalogProduct[];
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
};

export type CreditPack = {
  id: string;
  label: string;
  credits: number;
  amount: number;
  currency: string;
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
