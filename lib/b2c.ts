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
  amountKes?: number;
  amountInr?: number;
  prices?: {
    KES?: { amount: number; currency: string };
    INR?: { amount: number; currency: string };
  };
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
  error?: string | null;
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

export type PerfectCorpFeatureOption = {
  id: string;
  label: string;
  needsReferenceImage: boolean;
};

export type HairColorOption = {
  name: string;
  swatch: { primary: string; secondary?: string };
};

export type BeardTemplateOption = {
  id: string;
  title: string;
  thumb: string | null;
  category?: string;
};

export function listPerfectCorpOptions() {
  return apiGet<{
    configured: boolean;
    defaultFeature: string;
    defaultHairColorPreset: string;
    defaultBeardTemplateId: string;
    features: PerfectCorpFeatureOption[];
    hairColors: HairColorOption[];
    beardTemplates: BeardTemplateOption[];
  }>("/api/tryon/perfectcorp/options");
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

export async function payForTryon(
  jobId: string,
  opts?: { useFreeTryon?: boolean; gateway?: string; phone?: string }
): Promise<{
  job?: B2cJob;
  payment: {
    id: string;
    status: string;
    gateway?: string;
    failureReason?: string | null;
    customerMessage?: string | null;
    razorpay?: {
      keyId: string | null;
      orderId: string | null;
      amountPaise: number | null;
    } | null;
  };
  pending?: boolean;
  instructions?: string;
}> {
  const asPending = (body: Record<string, unknown>) => ({
    payment: body.payment as {
      id: string;
      status: string;
      gateway?: string;
      failureReason?: string | null;
      customerMessage?: string | null;
      razorpay?: {
        keyId: string | null;
        orderId: string | null;
        amountPaise: number | null;
      } | null;
    },
    pending: true as const,
    instructions: (body.instructions as string) || undefined,
  });

  try {
    const res = await apiPost<{
      job?: B2cJob;
      payment: {
        id: string;
        status: string;
        gateway?: string;
        failureReason?: string | null;
        customerMessage?: string | null;
        razorpay?: {
          keyId: string | null;
          orderId: string | null;
          amountPaise: number | null;
        } | null;
      };
      pending?: boolean;
      instructions?: string;
    }>(
      "/api/payments",
      {
        jobId,
        gateway: opts?.useFreeTryon ? "referral" : opts?.gateway || "auto",
        phone: opts?.phone,
        useFreeTryon: Boolean(opts?.useFreeTryon),
      },
      tok()
    );

    if (res.pending || res.payment?.status === "pending") {
      return {
        payment: res.payment,
        pending: true,
        instructions: res.instructions,
      };
    }
    return res;
  } catch (err) {
    const e = err as { status?: number; body?: Record<string, unknown> };
    if (e?.status === 402 && e.body?.payment) {
      return asPending(e.body);
    }
    throw err;
  }
}

export function verifyRazorpayPayment(body: {
  paymentId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  return apiPost<{
    payment: { id: string; status: string };
    pending?: boolean;
  }>("/api/payments/razorpay/verify", body, tok());
}

export function listPaymentMethods() {
  return apiGet<{
    defaultGateway: string;
    plannedGateway?: string | null;
    mpesaEnabled?: boolean;
    razorpayEnabled?: boolean;
    allowGatewayChoice?: boolean;
    sandboxAutoPaid?: boolean;
    mpesaSandbox?: boolean;
    razorpayKeyId?: string | null;
    paymentNotice?: string | null;
    methods: {
      id: string;
      label: string;
      available: boolean;
      currency?: string;
    }[];
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
      customerMessage?: string | null;
    };
  }>(`/api/payments/${id}`, tok());
}

/** Poll until paid / failed / cancelled or timeout (ms). */
export async function waitForPayment(
  paymentId: string,
  opts?: { timeoutMs?: number; intervalMs?: number }
) {
  const timeoutMs = opts?.timeoutMs ?? 90_000;
  const intervalMs = opts?.intervalMs ?? 1500;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const { payment } = await getPayment(paymentId);
    if (payment.status === "paid") return payment;

    // Keep waiting on pending; only hard-fail after we've given sandbox
    // auto-pay enough time (first 20s ignore failed/cancelled).
    if (payment.status === "failed" || payment.status === "cancelled") {
      const elapsed = Date.now() - started;
      const reason = payment.failureReason || `Payment ${payment.status}`;
      if (elapsed < 20_000) {
        await new Promise((r) => setTimeout(r, intervalMs));
        continue;
      }
      throw new Error(reason);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(
    "Payment confirmation timed out. If you paid on M-Pesa, check Payments or try again."
  );
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
