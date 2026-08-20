import { apiGet, apiPost, apiPostForm } from "./api";
import { getToken } from "./auth";

function tok() {
  return getToken() || undefined;
}

export type B2cPack = {
  id: string;
  label: string;
  images: number;
  amount: number;
  currency: string;
};

export type B2cJob = {
  id: string;
  channel?: string;
  pack: string | null;
  imageCount: number;
  amount: number;
  currency: string;
  sourceImageUrl: string;
  targetImageUrl: string;
  targetImageUrls?: string[];
  resultImageUrls: string[];
  status: "awaiting_payment" | "processing" | "completed" | "failed";
  createdAt?: string;
};

export type B2cStats = {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  today: number;
  spentTotal: number;
  currency: string;
};

export type B2cPayment = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  gateway: string;
  reference: string | null;
  purpose: string;
  createdAt: string;
  job: {
    id: string;
    pack: string | null;
    status: string;
    thumbnail: string | null;
  } | null;
};

export function listPricing() {
  return apiGet<{ packs: B2cPack[] }>("/api/tryon/pricing");
}

export function getMyStats() {
  return apiGet<{ stats: B2cStats; recent: B2cJob[] }>(
    "/api/tryon/mine/stats",
    tok()
  );
}

export function listMyJobs(params?: { page?: number; limit?: number; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);
  const q = qs.toString();
  return apiGet<{
    jobs: B2cJob[];
    page: number;
    pages: number;
    total: number;
  }>(`/api/tryon/mine${q ? `?${q}` : ""}`, tok());
}

export function getJob(id: string) {
  return apiGet<{ job: B2cJob }>(`/api/tryon/${id}`, tok());
}

export function createTryon(form: FormData) {
  return apiPostForm<{ job: B2cJob }>("/api/tryon", form, tok());
}

export function payForTryon(
  jobId: string,
  opts?: { useFreeTryon?: boolean; gateway?: string }
) {
  return apiPost<{
    job: B2cJob;
    payment: { id: string; status: string };
  }>(
    "/api/payments",
    {
      jobId,
      gateway: opts?.useFreeTryon ? "referral" : opts?.gateway || "stub",
      useFreeTryon: Boolean(opts?.useFreeTryon),
    },
    tok()
  );
}

export function listPaymentMethods() {
  return apiGet<{
    defaultGateway: string;
    paymentNotice?: string | null;
    methods: { id: string; label: string; available: boolean }[];
  }>("/api/payments/methods", tok());
}

export function getPayment(id: string) {
  return apiGet<{
    payment: {
      id: string;
      status: string;
      amount: number;
      currency: string;
      purpose: string;
      job: string | null;
      failureReason: string | null;
    };
  }>(`/api/payments/${id}`, tok());
}

export function cancelPayment(id: string) {
  return apiPost<{
    payment: {
      id: string;
      status: string;
      purpose: string;
      job: string | null;
    };
  }>(`/api/payments/${id}/cancel`, {}, tok());
}

export type ReferralStats = {
  referralCode: string;
  freeTryons: number;
  invites: number;
  rewardPerInvite: number;
  rewardOnJoin: number;
  wasReferred: boolean;
  referredAt: string | null;
};

export function getMyReferral() {
  return apiGet<{ referral: ReferralStats }>("/api/auth/referral", tok());
}

export function listMyPayments(params?: { page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const q = qs.toString();
  return apiGet<{
    payments: B2cPayment[];
    page: number;
    pages: number;
    total: number;
  }>(`/api/payments/mine${q ? `?${q}` : ""}`, tok());
}
