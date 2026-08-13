"use client";

import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  apiSendForm,
  API_BASE,
} from "./api";
import { getToken, type AuthUser } from "./auth";

export type CreditPack = {
  id: string;
  label: string;
  credits: number;
  amount: number;
  currency: string;
};

export type LedgerEntry = {
  id: string;
  type: "purchase" | "consume" | "adjust";
  amount: number;
  balanceAfter: number;
  reference: string | null;
  note: string | null;
  job: string | null;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  createdAt: string;
};

export type Product = {
  id: string;
  category: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  currency: string;
  imageUrls: string[];
  status: "active" | "archived";
  createdAt: string;
};

export type B2BJob = {
  id: string;
  channel: string;
  imageCount: number;
  creditsCost: number;
  product: string | null;
  sourceImageUrl: string;
  targetImageUrl: string;
  resultImageUrls: string[];
  status: "awaiting_payment" | "processing" | "completed" | "failed";
  createdAt: string;
};

export type BusinessStats = {
  catalog: {
    activeProducts: number;
    totalProducts: number;
    archivedProducts: number;
    categories: number;
    maxCategories: number;
  };
  branches?: {
    count: number;
    max: number;
  };
  credits: {
    balance: number;
    purchased: number;
    consumed: number;
    refunded: number;
  };
  tryons: {
    total: number;
    completed: number;
    failed: number;
    processing: number;
    today: number;
    last7: number;
    last30: number;
    successRate: number;
  };
  series: { date: string; count: number }[];
  popular: { productId: string; name: string; count: number; imageUrl?: string }[];
};

export type Branch = {
  id: string;
  name: string;
  address: {
    line1?: string | null;
    city?: string | null;
    country?: string | null;
    lat?: number | null;
    lng?: number | null;
  };
  phone: string | null;
  isPrimary: boolean;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt?: string;
};

function tok() {
  return getToken() || undefined;
}

// Fired whenever the credit balance may have changed, so the layout badge refreshes.
export function notifyCreditsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("zdc-credits"));
  }
}

/* --------------------------------- Profile -------------------------------- */

export function getProfile() {
  return apiGet<{ user: AuthUser; credits: number }>("/api/b2b/me", tok());
}

export function updateProfile(body: {
  phone?: string;
  firstName?: string;
  lastName?: string;
  business?: AuthUser["business"];
}) {
  return apiPatch<{ user: AuthUser }>("/api/b2b/me", body, tok());
}

/* -------------------------------- Branches -------------------------------- */

export function listBranches() {
  return apiGet<{ branches: Branch[]; limit: number; count: number }>(
    "/api/b2b/branches",
    tok()
  );
}

export function createBranch(body: {
  name: string;
  phone?: string;
  address?: Branch["address"];
  isPrimary?: boolean;
  status?: "active" | "inactive";
}) {
  return apiPost<{ branch: Branch }>("/api/b2b/branches", body, tok());
}

export function updateBranch(
  id: string,
  body: {
    name?: string;
    phone?: string;
    address?: Branch["address"];
    isPrimary?: boolean;
    status?: "active" | "inactive";
  }
) {
  return apiPatch<{ branch: Branch }>(`/api/b2b/branches/${id}`, body, tok());
}

export function deleteBranch(id: string) {
  return apiDelete<{ ok: boolean }>(`/api/b2b/branches/${id}`, tok());
}

/* --------------------------------- Stats ---------------------------------- */

export function getStats() {
  return apiGet<{ stats: BusinessStats }>("/api/b2b/stats", tok());
}

// Downloads the KPI report as an .xlsx file (streams the blob then saves it).
export async function downloadReport() {
  const res = await fetch(`${API_BASE}/api/b2b/stats/export.xlsx`, {
    headers: tok() ? { Authorization: `Bearer ${tok()}` } : undefined,
  });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const fileName = match?.[1] || "zdc-report.xlsx";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* --------------------------------- Credits -------------------------------- */

export function getBalance() {
  return apiGet<{ balance: number }>("/api/b2b/credits", tok());
}

export function getCreditPacks() {
  return apiGet<{ packs: CreditPack[] }>("/api/b2b/credits/packs");
}

export function getLedger(limit = 50) {
  return apiGet<{ ledger: LedgerEntry[] }>(
    `/api/b2b/credits/ledger?limit=${limit}`,
    tok()
  );
}

export async function purchaseCredits(packId: string) {
  const res = await apiPost<{ balance: number; credited: number }>(
    "/api/b2b/credits/purchase",
    { pack: packId, gateway: "stub" },
    tok()
  );
  notifyCreditsChanged();
  return res;
}

/* ------------------------------- Categories ------------------------------- */

export function listCategories() {
  return apiGet<{ categories: Category[] }>("/api/b2b/categories", tok());
}

export function createCategory(body: { name: string; description?: string }) {
  return apiPost<{ category: Category }>("/api/b2b/categories", body, tok());
}

export function updateCategory(
  id: string,
  body: { name?: string; description?: string; order?: number }
) {
  return apiPatch<{ category: Category }>(
    `/api/b2b/categories/${id}`,
    body,
    tok()
  );
}

export function deleteCategory(id: string) {
  return apiDelete<{ ok: boolean }>(`/api/b2b/categories/${id}`, tok());
}

/* -------------------------------- Products -------------------------------- */

export function listProducts(params?: { categoryId?: string; status?: string }) {
  const q = new URLSearchParams();
  if (params?.categoryId) q.set("categoryId", params.categoryId);
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  return apiGet<{ products: Product[] }>(
    `/api/b2b/products${qs ? `?${qs}` : ""}`,
    tok()
  );
}

export function createProduct(form: FormData) {
  return apiSendForm<{ product: Product }>(
    "POST",
    "/api/b2b/products",
    form,
    tok()
  );
}

export function updateProduct(id: string, form: FormData) {
  return apiSendForm<{ product: Product }>(
    "PATCH",
    `/api/b2b/products/${id}`,
    form,
    tok()
  );
}

export function deleteProduct(id: string) {
  return apiDelete<{ ok: boolean }>(`/api/b2b/products/${id}`, tok());
}

/* -------------------------------- Try-on ---------------------------------- */

export async function createB2BTryon(form: FormData) {
  const res = await apiSendForm<{ job: B2BJob; credits: number }>(
    "POST",
    "/api/b2b/tryon",
    form,
    tok()
  );
  notifyCreditsChanged();
  return res;
}

export function getJob(id: string) {
  return apiGet<{ job: B2BJob }>(`/api/tryon/${id}`);
}
