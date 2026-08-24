"use client";

import { apiPost } from "./api";
import { identifyUser, resetAnalytics } from "./analytics";

const TOKEN_KEY = "zdc_token";
const USER_KEY = "zdc_user";

export type BusinessProfile = {
  name?: string;
  category?: "boutique" | "salon" | "other"; // "other" legacy only; new signups are boutique|salon
  logoUrl?: string | null;
  whatsapp?: string | null;
  currency?: string;
  branchCount?: number;
  address?: {
    line1?: string | null;
    city?: string | null;
    country?: string | null;
    lat?: number | null;
    lng?: number | null;
  };
};

export type AuthUser = {
  id: string;
  email: string;
  role: "b2c" | "b2b" | "admin";
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  country?: string | null;
  currency?: string | null;
  status?: string;
  emailVerified?: boolean;
  referralCode?: string | null;
  freeTryons?: number;
  referredBy?: string | null;
  business?: BusinessProfile;
};

export function homeForRole(role?: string): string {
  if (role === "b2b") return "/business";
  if (role === "admin") return "/admin";
  return "/app";
}

export function saveAuth(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  identifyUser(user.id, { role: user.role, business: user.business?.name });
  window.dispatchEvent(new Event("zdc-auth"));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  resetAnalytics();
  window.dispatchEvent(new Event("zdc-auth"));
}

export function requestPasswordReset(email: string) {
  return apiPost<{
    ok: boolean;
    message: string;
    mock?: boolean;
    devOtp?: string;
    mockOtp?: string;
  }>("/api/auth/forgot-password", { email });
}

export function resetPasswordWithCode(body: {
  email: string;
  code: string;
  password: string;
}) {
  return apiPost<{ ok: boolean; message: string }>("/api/auth/reset-password", body);
}
