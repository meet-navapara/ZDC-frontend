"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/api";
import {
  getToken,
  getUser,
  saveAuth,
  type AuthUser,
} from "@/lib/auth";
import { LIMITS } from "@/lib/limits";
import { toast } from "@/lib/toast";

const inputClass =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage";

export default function ConsumerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [pwd, setPwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });

  useEffect(() => {
    const token = getToken();
    const cached = getUser();
    if (cached) {
      setEmail(cached.email);
      setForm({
        firstName: cached.firstName || "",
        lastName: cached.lastName || "",
        phone: "",
      });
    }
    apiGet<{ user: AuthUser }>("/api/auth/me", token || undefined)
      .then((r) => {
        setEmail(r.user.email);
        setForm({
          firstName: r.user.firstName || "",
          lastName: r.user.lastName || "",
          phone: r.user.phone || "",
        });
        if (token) saveAuth(token, r.user);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load profile")
      )
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const token = getToken();
      const res = await apiPatch<{ user: AuthUser }>(
        "/api/auth/me",
        {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
        },
        token || undefined
      );
      if (token) saveAuth(token, res.user);
      setNotice("Profile saved.");
      toast.success("Profile saved");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save profile";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (pwd.newPassword.length < 8) {
      const msg = "New password must be at least 8 characters.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      const msg = "New passwords do not match.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setPwdSaving(true);
    try {
      const token = getToken();
      await apiPatch<{ user: AuthUser }>(
        "/api/auth/me",
        {
          currentPassword: pwd.currentPassword,
          newPassword: pwd.newPassword,
        },
        token || undefined
      );
      setPwd({ currentPassword: "", newPassword: "", confirm: "" });
      setNotice("Password updated.");
      toast.success("Password updated");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not update password";
      setError(msg);
      toast.error(msg);
    } finally {
      setPwdSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="h-64 animate-pulse rounded-2xl bg-ink/5" />
        <div className="mt-4 h-56 animate-pulse rounded-2xl bg-ink/5" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-sage-dark">
          {notice}
        </div>
      )}

      {/* Profile form */}
      <form
        onSubmit={saveProfile}
        className="card space-y-5 rounded-2xl p-5 sm:p-6"
      >
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">
            Profile details
          </h3>
          <p className="mt-0.5 text-sm text-ink-muted">
            How you appear across zimji try-ons.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
              First name
            </span>
            <input
              maxLength={LIMITS.name}
              value={form.firstName}
              onChange={(e) =>
                setForm((f) => ({ ...f, firstName: e.target.value }))
              }
              className={inputClass}
              placeholder="John"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Last name
            </span>
            <input
              maxLength={LIMITS.name}
              value={form.lastName}
              onChange={(e) =>
                setForm((f) => ({ ...f, lastName: e.target.value }))
              }
              className={inputClass}
              placeholder="Doe"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Email
          </span>
          <input
            value={email}
            disabled
            className={`${inputClass} cursor-not-allowed bg-ink/[0.03] text-ink-muted`}
          />
          <span className="mt-1 block text-[11px] text-ink-muted">
            Email can’t be changed here. Contact{" "}
            <a
              href="mailto:jirani.deal@gmail.com"
              className="font-semibold text-sage hover:text-sage-dark"
            >
              jirani.deal@gmail.com
            </a>{" "}
            if you need a new one.
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Phone
          </span>
          <input
            maxLength={LIMITS.phone}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={inputClass}
            placeholder="+254 700 000 000"
          />
        </label>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-sage px-6 py-2.5 text-sm font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>

      {/* Password */}
      <form
        onSubmit={savePassword}
        className="card mt-4 space-y-5 rounded-2xl p-5 sm:p-6"
      >
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">
            Security
          </h3>
          <p className="mt-0.5 text-sm text-ink-muted">
            Change your password to keep your looks private.
          </p>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Current password
          </span>
          <input
            type="password"
            maxLength={LIMITS.password}
            value={pwd.currentPassword}
            onChange={(e) =>
              setPwd((p) => ({ ...p, currentPassword: e.target.value }))
            }
            className={inputClass}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
              New password
            </span>
            <input
              type="password"
              maxLength={LIMITS.password}
              value={pwd.newPassword}
              onChange={(e) =>
                setPwd((p) => ({ ...p, newPassword: e.target.value }))
              }
              className={inputClass}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Confirm new
            </span>
            <input
              type="password"
              maxLength={LIMITS.password}
              value={pwd.confirm}
              onChange={(e) =>
                setPwd((p) => ({ ...p, confirm: e.target.value }))
              }
              className={inputClass}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </label>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={
              pwdSaving ||
              !pwd.currentPassword ||
              !pwd.newPassword ||
              !pwd.confirm
            }
            className="rounded-full border border-ink/15 bg-white px-6 py-2.5 text-sm font-semibold text-ink transition hover:border-sage disabled:opacity-50"
          >
            {pwdSaving ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}
