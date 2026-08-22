"use client";

import { useCallback, useEffect, useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import { PhoneInput } from "@/components/PhoneInput";
import { AddressAutocomplete, type AddressParts } from "@/components/AddressAutocomplete";
import {
  listBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  type Branch,
} from "@/lib/b2b";
import { LIMITS } from "@/lib/limits";
import { countrySelectOptions, getCountryByName, matchCountry } from "@/lib/countries";
import { toast } from "@/lib/toast";

type FormState = {
  name: string;
  phone: string;
  line1: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  isPrimary: boolean;
  status: "active" | "inactive";
};

const emptyForm = (): FormState => ({
  name: "",
  phone: "",
  line1: "",
  city: "",
  country: "",
  lat: null,
  lng: null,
  isPrimary: false,
  status: "active",
});

const inputClass =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage";
const selectClass =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage";

function formatAddress(b: Branch) {
  const parts = [b.address?.line1, b.address?.city, b.address?.country].filter(
    Boolean
  );
  return parts.length ? parts.join(", ") : "No address set";
}

type Props = {
  /** Compact layout for embedding in Settings. */
  compact?: boolean;
  /** Bump this to re-fetch (e.g. after profile save). */
  refreshKey?: number;
};

export function BranchManager({ compact = false, refreshKey = 0 }: Props) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const refresh = useCallback(async () => {
    const r = await listBranches();
    setBranches(r.branches);
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [refresh, refreshKey]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
    setError("");
    setNotice("");
  }

  function openEdit(b: Branch) {
    setEditingId(b.id);
    setForm({
      name: b.name,
      phone: b.phone || "",
      line1: b.address?.line1 || "",
      city: b.address?.city || "",
      country:
        matchCountry(b.address?.country) || b.address?.country || "",
      lat: b.address?.lat ?? null,
      lng: b.address?.lng ?? null,
      isPrimary: b.isPrimary,
      status: b.status,
    });
    setShowForm(true);
    setError("");
    setNotice("");
  }

  function onAddress(parts: Partial<AddressParts>) {
    setForm((f) => ({
      ...f,
      ...(parts.line1 !== undefined ? { line1: parts.line1 } : {}),
      ...(parts.city ? { city: parts.city } : {}),
      ...(parts.country
        ? { country: matchCountry(parts.country) || parts.country }
        : {}),
      ...(parts.lat != null && parts.lng != null
        ? { lat: parts.lat, lng: parts.lng }
        : {}),
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const body = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      isPrimary: form.isPrimary,
      status: form.status,
      address: {
        line1: form.line1 || null,
        city: form.city || null,
        country: form.country || null,
        ...(form.lat != null && form.lng != null
          ? { lat: form.lat, lng: form.lng }
          : {}),
      },
    };
    try {
      if (editingId) {
        await updateBranch(editingId, body);
        setNotice("Branch updated.");
        toast.success("Branch updated");
      } else {
        await createBranch(body);
        setNotice("Branch added.");
        toast.success("Branch added");
      }
      setShowForm(false);
      setEditingId(null);
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save branch";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(b: Branch) {
    if (!window.confirm(`Remove “${b.name}”? This cannot be undone.`)) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await deleteBranch(b.id);
      setNotice("Branch removed.");
      toast.success("Branch removed");
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not delete";
      setError(msg);
      toast.error(msg);
    }
  }

  async function makePrimary(b: Branch) {
    setError("");
    try {
      await updateBranch(b.id, { isPrimary: true });
      setNotice(`“${b.name}” is now the primary branch.`);
      toast.success("Primary branch updated");
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <div className={compact ? "space-y-4" : ""}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {!compact && (
            <h1 className="font-display text-3xl font-semibold text-ink">
              Branches
            </h1>
          )}
          {compact ? (
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">
                Your locations
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Add as many branches as you need.{" "}
                <span className="font-medium text-ink">
                  {branches.length} location
                  {branches.length === 1 ? "" : "s"}
                </span>
                .
              </p>
            </div>
          ) : (
            <p className="mt-1 text-ink-muted">
              Manage salon or boutique locations.{" "}
              <span className="font-medium text-ink">
                {branches.length} location
                {branches.length === 1 ? "" : "s"}
              </span>
              .
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-sage-dark"
        >
          Add branch
        </button>
      </div>

      {notice && (
        <div
          className={`${compact ? "" : "mt-4"} rounded-xl border border-sage/40 bg-sage/10 px-4 py-3 text-sm text-sage-dark`}
        >
          {notice}
        </div>
      )}
      {error && (
        <div
          className={`${compact ? "" : "mt-4"} rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700`}
        >
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={onSubmit}
          className={`${compact ? "border border-ink/10 bg-paper-100/60" : "card mt-6"} space-y-4 rounded-2xl p-5`}
        >
          <h3 className="font-display text-lg font-semibold text-ink">
            {editingId ? "Edit branch" : "New branch"}
          </h3>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              Branch name <span className="text-red-500">*</span>
            </label>
            <input
              required
              maxLength={LIMITS.branchName}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
              placeholder="Westlands · Flagship"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              Phone
            </label>
            <PhoneInput
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              country={form.country || "Kenya"}
              onCountryDetected={(name) =>
                setForm((f) => ({ ...f, country: name }))
              }
              placeholder="712 345 678"
              aria-label="Branch phone"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              Address
            </label>
            <AddressAutocomplete
              value={form.line1}
              onChange={onAddress}
              placeholder="Start typing the branch address…"
              className={inputClass}
            />
            {form.lat != null && form.lng != null && (
              <p className="mt-1 text-xs text-ink-muted">
                Pinned at {form.lat.toFixed(4)}, {form.lng.toFixed(4)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">
                City
              </label>
              <input
                maxLength={LIMITS.city}
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">
                Country
              </label>
              <CustomSelect
                value={form.country}
                onChange={(v) => setForm((f) => ({ ...f, country: v }))}
                placeholder="Select country"
                searchable
                searchPlaceholder="Type country name…"
                options={countrySelectOptions(
                  form.country && !getCountryByName(form.country)
                    ? [{ value: form.country, label: form.country }]
                    : undefined
                )}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isPrimary: e.target.checked }))
                }
                className="h-4 w-4 rounded border-ink/30 text-sage focus:ring-sage"
              />
              Primary / HQ branch
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <span className="text-ink-muted">Status</span>
              <CustomSelect
                size="sm"
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v as "active" | "inactive" }))}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add branch"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className={`${compact ? "" : "mt-8"} space-y-3`}>
          <div className="h-20 animate-pulse rounded-2xl bg-ink/5" />
          <div className="h-20 animate-pulse rounded-2xl bg-ink/5" />
        </div>
      ) : branches.length === 0 ? (
        <p
          className={`${compact ? "" : "mt-8"} rounded-xl border border-dashed border-ink/15 px-4 py-6 text-center text-sm text-ink-muted`}
        >
          No branches yet. Add your first location to get started.
        </p>
      ) : (
        <ul className={`${compact ? "" : "mt-8"} space-y-3`}>
          {branches.map((b) => (
            <li
              key={b.id}
              className={`${compact ? "border border-ink/10 bg-white" : "card"} flex flex-wrap items-start justify-between gap-4 rounded-2xl p-4`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-ink sm:text-lg">
                    {b.name}
                  </h3>
                  {b.isPrimary && (
                    <span className="rounded-full bg-sage/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                      Primary
                    </span>
                  )}
                  {b.status === "inactive" && (
                    <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink-muted">{formatAddress(b)}</p>
                {b.phone && (
                  <p className="mt-0.5 text-sm text-ink-muted">{b.phone}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!b.isPrimary && (
                  <button
                    type="button"
                    onClick={() => makePrimary(b)}
                    className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-sage"
                  >
                    Set primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(b)}
                  className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-ink/30"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(b)}
                  className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
