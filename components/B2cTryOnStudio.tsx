"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { getToken, getUser, saveAuth, type AuthUser } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { TryOnResultReady } from "@/components/TryOnResultReady";
import {
  isPhotoGuideDismissed,
  PhotoGuideModal,
} from "@/components/LandingPhotoGuide";
import {
  createTryon,
  getJob,
  getMyReferral,
  listPaymentMethods,
  listPerfectCorpOptions,
  listPricing,
  payForTryon,
  verifyRazorpayPayment,
  waitForPayment,
  type B2cJob,
  type B2cPack,
  type PerfectCorpFeatureOption,
} from "@/lib/b2c";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { toast } from "@/lib/toast";
import { CheckoutCoupon } from "@/components/CheckoutCoupon";
import { fetchWelcomeCoupon, type CouponQuote } from "@/lib/coupons";
import {
  friendlyTryOnError,
  readImageDimensions,
  tryOnImageSizeMessage,
  tryOnImageTooSmall,
} from "@/lib/tryOnImage";
import {
  BeardStylePicker,
  HairColorPicker,
} from "@/components/PerfectCorpPickers";
import type { BeardTemplateOption, HairColorOption } from "@/lib/b2c";
import {
  tryOnFeatureLabel,
  tryOnFeatureShortLabel,
} from "@/lib/tryOnFeatures";

type Pack = B2cPack;
type Job = B2cJob;
type Stage =
  | "form"
  | "working"
  | "awaiting_mpesa"
  | "awaiting_razorpay"
  | "processing"
  | "done"
  | "error";

/** Map Safaricom ResultDesc into actionable copy for the try-on UI. */
function friendlyMpesaFailure(raw: string, sandboxHints: boolean): string {
  const m = raw.toLowerCase();
  if (m.includes("ds timeout") || m.includes("cannot be reached") || m.includes("1037")) {
    if (sandboxHints) {
      return (
        "M-Pesa timed out (no PIN entered / phone unreachable). " +
        "In sandbox, use 254708374149, watch for the STK prompt (or Daraja simulator), " +
        "enter PIN 174379 within ~30 seconds, then try again."
      );
    }
    return "M-Pesa timed out. Check your phone for the STK prompt and try again.";
  }
  if (m.includes("cancel") || m.includes("1032")) {
    return "M-Pesa payment was cancelled on the phone. Try again and approve the prompt.";
  }
  if (m.includes("insufficient")) {
    return "Insufficient M-Pesa balance for this payment.";
  }
  return raw;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function getTryonUploadCopy(feature: string, targetCount: number) {
  switch (feature) {
    case "hair":
      return {
        desc:
          targetCount > 1
            ? `Your selfie plus ${targetCount} hairstyles — one styled result each.`
            : "Your selfie and the hairstyle you want to try.",
        stepTitle: "Upload your photos",
        targetLabel: (i: number) =>
          targetCount > 1 ? `Hairstyle ${i + 1}` : "Hairstyle",
        targetHint: "Reference hair look",
        targetWord: "hairstyle",
      };
    case "haircolor":
      return {
        desc:
          targetCount > 1
            ? `Your selfie, then pick ${targetCount} hair colors — one result each.`
            : "Your selfie and the hair color you want to try.",
        stepTitle: `Choose ${tryOnFeatureShortLabel("haircolor").toLowerCase()}`,
        targetLabel: (i: number) =>
          targetCount > 1 ? `Color ${i + 1}` : tryOnFeatureShortLabel("haircolor"),
        targetHint: "Pick a shade",
        targetWord: "hair color",
      };
    case "beard":
      return {
        desc:
          targetCount > 1
            ? `Your selfie, then pick ${targetCount} beard styles — one result each.`
            : "Your selfie and the beard style you want to try.",
        stepTitle: `Choose ${tryOnFeatureShortLabel("beard").toLowerCase()}`,
        targetLabel: (i: number) =>
          targetCount > 1 ? `Style ${i + 1}` : tryOnFeatureShortLabel("beard"),
        targetHint: "Pick a style",
        targetWord: "beard style",
      };
    default:
      return {
        desc:
          targetCount > 1
            ? `Your selfie plus ${targetCount} different outfits — one styled result each.`
            : "Your selfie and the outfit you want to try.",
        stepTitle: "Upload your photos",
        targetLabel: (i: number) =>
          targetCount > 1 ? `Outfit ${i + 1}` : "Outfit / hairstyle",
        targetHint: "Dress, outfit…",
        targetWord: "outfit",
      };
  }
}

function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Use a PNG, JPG, or WEBP image.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "Image is larger than 10 MB.";
  }
  return null;
}

function UploadBox({
  label,
  hint,
  file,
  onPick,
  sizeClass = "aspect-[3/4]",
  compact = false,
  showGuide = false,
}: {
  label: string;
  hint: string;
  file: File | null;
  onPick: (f: File | null) => void;
  sizeClass?: string;
  compact?: boolean;
  /** Show the photo-quality guide before the file picker (selfie only). */
  showGuide?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string>("");
  const [guideOpen, setGuideOpen] = useState(false);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function accept(f: File | null) {
    setLocalError("");
    if (!f) {
      onPick(null);
      return;
    }
    const err = validateImage(f);
    if (err) {
      setLocalError(err);
      return;
    }
    readImageDimensions(f)
      .then(({ width, height }) => {
        if (tryOnImageTooSmall(width, height)) {
          setLocalError(tryOnImageSizeMessage(width, height));
          return;
        }
        onPick(f);
      })
      .catch(() => setLocalError("Could not read image. Try another file."));
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function requestPick() {
    if (showGuide && !isPhotoGuideDismissed()) {
      setGuideOpen(true);
      return;
    }
    openPicker();
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
        onClick={requestPick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            requestPick();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          accept(e.dataTransfer.files?.[0] || null);
        }}
        className={`group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl text-center transition ${sizeClass} ${
          dragOver
            ? "border-2 border-dashed border-sage bg-sage/10 dark:bg-sage/15"
            : preview
              ? "border border-ink/10 shadow-sm dark:border-white/10 dark:shadow-black/20"
              : "border-2 border-dashed border-ink/15 bg-white/50 hover:border-sage hover:bg-white dark:border-white/12 dark:bg-[#181511] dark:hover:border-sage/70 dark:hover:bg-[#1d1914]"
        }`}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={label}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-ink/55 px-2.5 py-0.5 text-[10px] font-semibold text-paper backdrop-blur-sm">
              {label}
            </span>
            <button
              type="button"
              aria-label={`Remove ${label}`}
              onClick={(e) => {
                e.stopPropagation();
                accept(null);
              }}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink/55 text-sm leading-none text-paper opacity-0 backdrop-blur-sm transition hover:bg-ink group-hover:opacity-100"
            >
              ×
            </button>
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent pb-2 pt-6 text-xs font-medium text-paper opacity-0 transition group-hover:opacity-100">
              Click to change
            </span>
          </>
        ) : (
          <div className="px-3">
            <div
              className={`mx-auto flex items-center justify-center rounded-full bg-sage/10 text-sage transition group-hover:bg-sage/20 dark:bg-sage/15 dark:group-hover:bg-sage/25 ${
                compact ? "h-9 w-9 text-lg" : "h-12 w-12 text-xl"
              }`}
            >
              +
            </div>
            <div
              className={`font-semibold text-ink ${
                compact ? "mt-2 text-xs" : "mt-3 text-sm"
              }`}
            >
              {label}
            </div>
            {!compact && (
              <>
                <div className="mt-1 text-xs text-ink-muted dark:text-[#b1a99c]">{hint}</div>
                <div className="mt-2 text-[11px] text-ink-muted/70 dark:text-[#8f877b]">
                  Drag &amp; drop · PNG/JPG/WEBP · 10 MB
                </div>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0] || null)}
        />
      </div>

      {showGuide ? (
        <PhotoGuideModal
          open={guideOpen}
          onClose={() => setGuideOpen(false)}
          onSelect={() => {
            setGuideOpen(false);
            openPicker();
          }}
        />
      ) : null}

      {localError && (
        <p className="mt-1.5 px-1 text-xs text-red-600">{localError}</p>
      )}
    </div>
  );
}

function SectionHead({
  n,
  title,
  desc,
}: {
  n: number;
  title: string;
  desc?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper">
        {n}
      </span>
      <div>
        <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
        {desc && <p className="mt-0.5 text-sm text-ink-muted">{desc}</p>}
      </div>
    </div>
  );
}

/** Consumer try-on studio — used inside the B2C dashboard. */
export default function B2cTryOnStudio() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [packId, setPackId] = useState<string>("single");
  const [featureOptions, setFeatureOptions] = useState<PerfectCorpFeatureOption[]>([]);
  const [feature, setFeature] = useState<string>("cloth");
  const [hairColorOptions, setHairColorOptions] = useState<HairColorOption[]>([]);
  const [beardTemplates, setBeardTemplates] = useState<BeardTemplateOption[]>([]);
  const [defaultHairColor, setDefaultHairColor] = useState("Honey Blonde");
  const [defaultBeardTemplate, setDefaultBeardTemplate] = useState("all_anchor");
  const [hairColorSelections, setHairColorSelections] = useState<string[]>([
    "Honey Blonde",
  ]);
  const [beardSelections, setBeardSelections] = useState<string[]>(["all_anchor"]);
  const [source, setSource] = useState<File | null>(null);
  const [targets, setTargets] = useState<(File | null)[]>([null]);
  const [sourcePreview, setSourcePreview] = useState<string>("");
  const [stage, setStage] = useState<Stage>("form");
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [freeTryons, setFreeTryons] = useState(0);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [defaultGateway, setDefaultGateway] = useState("stub");
  const [mpesaEnabled, setMpesaEnabled] = useState(false);
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [allowGatewayChoice, setAllowGatewayChoice] = useState(false);
  const [sandboxAutoPaid, setSandboxAutoPaid] = useState(false);
  const [mpesaSandbox, setMpesaSandbox] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<
    "mpesa" | "razorpay" | "stub" | "auto"
  >("auto");
  const [mpesaPhone, setMpesaPhone] = useState(
    () => getUser()?.phone || ""
  );
  const [mpesaHint, setMpesaHint] = useState("");
  const [couponQuote, setCouponQuote] = useState<CouponQuote | null>(null);
  const [couponCode, setCouponCode] = useState("");
  /** Bump to re-fetch welcome eligibility (e.g. after a successful try-on). */
  const [welcomeRefreshKey, setWelcomeRefreshKey] = useState(0);
  const searchParams = useSearchParams();

  useEffect(() => {
    listPricing()
      .then((r) => {
        setPacks(r.packs);
        if (r.packs.length && !r.packs.some((p) => p.id === packId)) {
          setPackId(r.packs[0].id);
        }
      })
      .catch(() => setPacks([]));

    getMyReferral()
      .then((r) => setFreeTryons(r.referral.freeTryons))
      .catch(() => setFreeTryons(getUser()?.freeTryons || 0));

    listPaymentMethods()
      .then((r) => {
        setPaymentNotice(r.paymentNotice || null);
        const def = (r.defaultGateway || "stub") as
          | "mpesa"
          | "razorpay"
          | "stub"
          | "auto";
        setDefaultGateway(def);
        setMpesaEnabled(Boolean(r.mpesaEnabled));
        setRazorpayEnabled(Boolean(r.razorpayEnabled));
        setAllowGatewayChoice(Boolean(r.allowGatewayChoice));
        setSandboxAutoPaid(Boolean(r.sandboxAutoPaid));
        setMpesaSandbox(Boolean(r.mpesaSandbox));
        setSelectedGateway(
          r.allowGatewayChoice
            ? def === "razorpay" || def === "mpesa"
              ? def
              : r.mpesaEnabled
                ? "mpesa"
                : "razorpay"
            : def
        );
      })
      .catch(() => {});

    listPerfectCorpOptions()
      .then((r) => {
        if (r.features?.length) setFeatureOptions(r.features);
        const initial =
          r.features?.find((f) => f.id === r.defaultFeature)?.id ||
          r.defaultFeature ||
          "cloth";
        setFeature(initial);
        setHairColorOptions(r.hairColors || []);
        setBeardTemplates(r.beardTemplates || []);
        const hairDefault =
          r.defaultHairColorPreset || r.hairColors?.[0]?.name || "Honey Blonde";
        const beardDefault =
          r.defaultBeardTemplateId || r.beardTemplates?.[0]?.id || "all_anchor";
        setDefaultHairColor(hairDefault);
        setDefaultBeardTemplate(beardDefault);
        setHairColorSelections([hairDefault]);
        setBeardSelections([beardDefault]);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const jobId = searchParams.get("job");
    if (!jobId) return;
    getJob(jobId)
      .then((r) => {
        setJob(r.job);
        if (r.job.status === "completed") setStage("done");
        else if (r.job.status === "failed") {
          setError(friendlyTryOnError(r.job.error));
          setStage("error");
        } else {
          setStage("processing");
        }
      })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    if (stage !== "processing" || !job) return;
    const startedAt = Date.now();
    const interval = setInterval(async () => {
      try {
        const r = await getJob(job.id);
        if (r.job.status === "completed") {
          setJob(r.job);
          setStage("done");
          toast.success("Try-on complete");
          track("b2c_render_completed", {
            pack: r.job.pack,
            results: r.job.resultImageUrls.length,
          });
          clearInterval(interval);
        } else if (r.job.status === "awaiting_payment") {
          // Avoid "infinite processing" UI when payment never gets confirmed.
          if (Date.now() - startedAt > 60_000) {
            const msg =
              "Payment confirmation timed out. Please check your Payments page and try again.";
            setError(msg);
            toast.error(msg);
            setStage("error");
            clearInterval(interval);
          }
        } else if (r.job.status === "failed") {
          const msg = friendlyTryOnError(r.job.error);
          setError(msg);
          toast.error(msg);
          setStage("error");
          clearInterval(interval);
        }
      } catch {
        // keep polling
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [stage, job]);

  const selectedPack = packs.find((p) => p.id === packId);
  const targetCount = selectedPack?.images ?? 1;
  const needsReferenceImage =
    featureOptions.find((f) => f.id === feature)?.needsReferenceImage ??
    (feature === "cloth" || feature === "hair");
  const uploadCopy = useMemo(
    () => getTryonUploadCopy(feature, targetCount),
    [feature, targetCount]
  );

  useEffect(() => {
    if (needsReferenceImage) return;
    if (feature === "haircolor") {
      setHairColorSelections((prev) => {
        const seed = prev[0] || defaultHairColor;
        return Array.from({ length: targetCount }, (_, i) => prev[i] || seed);
      });
    }
    if (feature === "beard") {
      setBeardSelections((prev) => {
        const seed = prev[0] || defaultBeardTemplate;
        return Array.from({ length: targetCount }, (_, i) => prev[i] || seed);
      });
    }
  }, [targetCount, feature, needsReferenceImage, defaultHairColor, defaultBeardTemplate]);
  const payGateway =
    selectedGateway === "auto" ? defaultGateway : selectedGateway;
  const payWithRazorpay = payGateway === "razorpay";
  const displayAmount =
    payGateway === "razorpay"
      ? selectedPack?.amountInr ?? selectedPack?.prices?.INR?.amount ?? selectedPack?.amount
      : payGateway === "mpesa"
        ? selectedPack?.amountKes ?? selectedPack?.prices?.KES?.amount ?? selectedPack?.amount
        : selectedPack?.amount;
  const displayCurrency =
    payGateway === "razorpay"
      ? "INR"
      : payGateway === "mpesa"
        ? "KES"
        : selectedPack?.currency || "KES";
  const payableAmount =
    couponQuote &&
    couponQuote.currency === displayCurrency &&
    couponQuote.subtotal === Number(displayAmount)
      ? couponQuote.finalAmount
      : displayAmount;
  const needsMpesaPhone =
    payGateway === "mpesa" && Number(payableAmount) > 0;
  const isFreeCheckout = Number(payableAmount) === 0 && Boolean(couponQuote);

  useEffect(() => {
    setCouponQuote(null);
    setCouponCode("");
    // Only auto-apply while the checkout form is visible
    if (stage !== "form") return;
    if (!packId || displayAmount == null || !Number.isFinite(Number(displayAmount))) {
      return;
    }
    if (!getToken()) return;

    let cancelled = false;
    fetchWelcomeCoupon({
      packId,
      currency: displayCurrency,
    })
      .then((r) => {
        if (cancelled || !r.eligible || !("quote" in r) || !r.quote) return;
        setCouponQuote(r.quote);
        setCouponCode(r.quote.coupon.code);
      })
      .catch(() => {
        /* not eligible or offline — ignore */
      });

    return () => {
      cancelled = true;
    };
  }, [packId, displayCurrency, displayAmount, stage, welcomeRefreshKey]);

  useEffect(() => {
    setTargets((prev) => {
      if (prev.length === targetCount) return prev;
      const next = prev.slice(0, targetCount);
      while (next.length < targetCount) next.push(null);
      return next;
    });
  }, [targetCount]);

  const targetsFilled =
    targets.length === targetCount && targets.every(Boolean);
  const hairColorsFilled =
    hairColorSelections.length === targetCount &&
    hairColorSelections.every(Boolean);
  const beardsFilled =
    beardSelections.length === targetCount && beardSelections.every(Boolean);
  const styleReady =
    feature === "haircolor"
      ? hairColorsFilled
      : feature === "beard"
        ? beardsFilled
        : targetsFilled;
  const canSubmit =
    !!source &&
    styleReady &&
    stage !== "working" &&
    stage !== "awaiting_mpesa" &&
    stage !== "awaiting_razorpay" &&
    (!needsMpesaPhone || mpesaPhone.trim().length >= 9);

  async function handleSubmit(useFreeTryon = false) {
    setError("");
    setMpesaHint("");
    if (!getToken()) {
      setError("Please log in to start a try-on.");
      setStage("error");
      return;
    }
    if (!source) {
      setError("Please upload your selfie first.");
      return;
    }
    if (feature === "haircolor" && !hairColorsFilled) {
      setError("Please choose a hair color for each result.");
      return;
    }
    if (feature === "beard" && !beardsFilled) {
      setError("Please choose a beard style for each result.");
      return;
    }
    if (needsReferenceImage && targets.some((t) => !t)) {
      setError(
        `Please upload your selfie and ${targetCount} ${uploadCopy.targetWord} image${
          targetCount > 1 ? "s" : ""
        }.`
      );
      return;
    }
    if (useFreeTryon && targetCount !== 1) {
      setError("Free try-ons only work with the Single pack.");
      return;
    }
    if (!useFreeTryon && needsMpesaPhone && mpesaPhone.trim().length < 9) {
      setError("Enter your M-Pesa phone number (Safaricom).");
      return;
    }
    setStage("working");
    track("b2c_tryon_started", { pack: packId, free: useFreeTryon });
    setSourcePreview(URL.createObjectURL(source));
    try {
      const form = new FormData();
      form.append("pack", packId);
      form.append("source", source);
      form.append("feature", feature);
      if (feature === "haircolor") {
        form.append("hairColorPresets", hairColorSelections.join("|"));
      } else if (feature === "beard") {
        form.append("beardTemplateIds", beardSelections.join("|"));
      } else {
        targets.forEach((t) => {
          if (t) form.append("target", t);
        });
      }

      const created = await createTryon(form);
      const paid = await payForTryon(created.job.id, {
        useFreeTryon,
        gateway: useFreeTryon
          ? "referral"
          : payGateway === "stub"
            ? "auto"
            : payGateway,
        phone: useFreeTryon ? undefined : mpesaPhone.trim() || undefined,
        couponCode: useFreeTryon ? undefined : couponCode || undefined,
      });

      if (paid.pending && paid.payment?.id) {
        setJob(created.job);

        // India / Razorpay Checkout
        const rz = paid.payment.razorpay;
        if (
          (paid.payment.gateway === "razorpay" || payWithRazorpay) &&
          rz?.keyId &&
          rz?.orderId &&
          rz?.amountPaise
        ) {
          setMpesaHint(
            paid.instructions || "Complete payment in the Razorpay window…"
          );
          setStage("awaiting_razorpay");
          await new Promise((r) => setTimeout(r, 150));
          const user = getUser();
          const checkout = await openRazorpayCheckout({
            key: rz.keyId,
            orderId: rz.orderId,
            amountPaise: rz.amountPaise,
            currency: "INR",
            description: `zimji try-on (${packId})`,
            prefill: {
              email: user?.email || undefined,
              contact: user?.phone || undefined,
              name: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
            },
          });
          await verifyRazorpayPayment({
            paymentId: paid.payment.id,
            razorpay_order_id: checkout.razorpay_order_id,
            razorpay_payment_id: checkout.razorpay_payment_id,
            razorpay_signature: checkout.razorpay_signature,
          });
          const refreshed = await getJob(created.job.id);
          if (refreshed.job.status === "awaiting_payment") {
            throw new Error("Payment was not confirmed. Please try again.");
          }
          track("b2c_payment_succeeded", {
            pack: packId,
            amount: refreshed.job.amount,
            currency: refreshed.job.currency,
            free: false,
            gateway: "razorpay",
          });
          toast.success("Payment received");
          setJob(refreshed.job);
          setStage("processing");
          return;
        }

        // Kenya / M-Pesa STK
        setMpesaHint(
          paid.instructions ||
            "Approve the M-Pesa prompt on your phone, then wait here."
        );
        setStage("awaiting_mpesa");
        await new Promise((r) => setTimeout(r, 150));
        try {
          await waitForPayment(paid.payment.id, {
            timeoutMs: 90_000,
            intervalMs: 4000,
          });
        } catch (payErr) {
          const msg =
            payErr instanceof Error ? payErr.message : "Payment failed";
          throw new Error(friendlyMpesaFailure(msg, mpesaSandbox && !sandboxAutoPaid));
        }
        const refreshed = await getJob(created.job.id);
        if (refreshed.job.status === "awaiting_payment") {
          throw new Error(
            friendlyMpesaFailure(
              "Payment was not confirmed. DS timeout / PIN not entered — try again and approve within 30 seconds.",
              mpesaSandbox && !sandboxAutoPaid
            )
          );
        }
        track("b2c_payment_succeeded", {
          pack: packId,
          amount: refreshed.job.amount,
          currency: refreshed.job.currency,
          free: false,
          gateway: "mpesa",
        });
        toast.success("Payment received");
        setJob(refreshed.job);
        setStage("processing");
        return;
      }

      if (!paid.job) {
        throw new Error("Payment completed but job was not returned.");
      }

      track("b2c_payment_succeeded", {
        pack: packId,
        amount: paid.job.amount,
        currency: paid.job.currency,
        free: useFreeTryon,
      });
      if (!useFreeTryon) toast.success("Payment received");
      // Welcome / coupon is one-shot — clear and re-check on next form visit
      setCouponQuote(null);
      setCouponCode("");
      setWelcomeRefreshKey((k) => k + 1);
      setJob(paid.job);
      setStage("processing");
      if (useFreeTryon) {
        setFreeTryons((n) => Math.max(0, n - 1));
        const token = getToken();
        const me = await apiGet<{ user: AuthUser }>(
          "/api/auth/me",
          token || undefined
        ).catch(() => null);
        if (me?.user && token) saveAuth(token, me.user);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
      setStage("error");
    }
  }

  function reset() {
    if (sourcePreview) URL.revokeObjectURL(sourcePreview);
    setSource(null);
    setTargets((prev) => prev.map(() => null));
    setSourcePreview("");
    setJob(null);
    setError("");
    setCouponQuote(null);
    setCouponCode("");
    setWelcomeRefreshKey((k) => k + 1);
    setStage("form");
  }

  return (
    <div className="mx-auto max-w-5xl">
      {stage === "awaiting_mpesa" && (
        <div className="card mx-auto max-w-lg rounded-2xl p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
          <h2 className="mt-5 font-display text-2xl font-semibold text-ink">
            Confirm on M-Pesa
          </h2>
          <p className="mt-3 text-sm text-ink-muted">
            {mpesaHint ||
              "Enter your PIN on the Safaricom prompt. This page updates when payment clears."}
          </p>
          <ul className="mt-5 space-y-2 text-left text-xs text-ink-muted">
            <li>1. Keep this tab open.</li>
            <li>
              2. On the phone (or Daraja STK simulator), open the M-Pesa prompt.
            </li>
            {mpesaSandbox && !sandboxAutoPaid && (
              <li>
                3. Sandbox test PIN is often{" "}
                <span className="font-semibold text-ink">174379</span>.
              </li>
            )}
            <li>
              {mpesaSandbox && !sandboxAutoPaid ? "4" : "3"}. Approve within ~30
              seconds or Safaricom returns “DS timeout”.
            </li>
          </ul>
        </div>
      )}

      {stage === "awaiting_razorpay" && (
        <div className="card mx-auto max-w-lg rounded-2xl p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
          <h2 className="mt-5 font-display text-2xl font-semibold text-ink">
            Complete Razorpay payment
          </h2>
          <p className="mt-3 text-sm text-ink-muted">
            {mpesaHint ||
              "Finish UPI / card payment in the Razorpay window. This page continues when it succeeds."}
          </p>
        </div>
      )}

      {(stage === "form" || stage === "working") && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="card rounded-2xl p-5 sm:rounded-3xl sm:p-8">
              <SectionHead
                n={1}
                title="Choose try-on type"
                desc="Pick a style, then upload your photo."
              />
              {featureOptions.length > 0 ? (
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {featureOptions.map((f) => {
                    const selected = feature === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFeature(f.id)}
                        className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                          selected
                            ? "border-sage bg-sage/10 font-semibold text-sage-dark"
                            : "border-ink/10 text-ink hover:border-sage/40"
                        }`}
                      >
                        {tryOnFeatureLabel(f.id)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-ink-muted">
                  {tryOnFeatureLabel("cloth")} (upload selfie + reference photo)
                </p>
              )}

            </div>

            <div className="card rounded-2xl p-5 sm:rounded-3xl sm:p-8">
              <SectionHead
                n={2}
                title={uploadCopy.stepTitle || "Upload your photos"}
                desc={uploadCopy.desc}
              />
              <div
                className={`mt-5 grid gap-3 sm:mt-6 sm:gap-4 ${
                  needsReferenceImage && targetCount > 1
                    ? "grid-cols-2 sm:grid-cols-4"
                    : needsReferenceImage
                      ? "mx-auto max-w-md grid-cols-2"
                      : "mx-auto max-w-xs grid-cols-1"
                }`}
              >
                <UploadBox
                  label="Selfie / Gallery"
                  hint="Clear, front-facing photo"
                  file={source}
                  onPick={setSource}
                  compact={needsReferenceImage && targetCount > 1}
                  showGuide
                />
                {needsReferenceImage &&
                  targets.map((t, i) => (
                    <UploadBox
                      key={i}
                      label={uploadCopy.targetLabel(i)}
                      hint={uploadCopy.targetHint}
                      file={t}
                      onPick={(f) =>
                        setTargets((prev) =>
                          prev.map((x, idx) => (idx === i ? f : x))
                        )
                      }
                      compact={targetCount > 1}
                    />
                  ))}
              </div>

              {feature === "haircolor" && hairColorOptions.length > 0 && (
                <div className="mt-6 space-y-4">
                  {Array.from({ length: targetCount }, (_, i) => (
                    <HairColorPicker
                      key={i}
                      label={
                        targetCount > 1
                          ? uploadCopy.targetLabel(i)
                          : undefined
                      }
                      options={hairColorOptions}
                      value={hairColorSelections[i] || defaultHairColor}
                      onChange={(name) =>
                        setHairColorSelections((prev) =>
                          prev.map((x, idx) => (idx === i ? name : x))
                        )
                      }
                    />
                  ))}
                </div>
              )}

              {feature === "beard" && beardTemplates.length > 0 && (
                <div className="mt-6 space-y-4">
                  {Array.from({ length: targetCount }, (_, i) => (
                    <BeardStylePicker
                      key={i}
                      label={
                        targetCount > 1
                          ? uploadCopy.targetLabel(i)
                          : undefined
                      }
                      templates={beardTemplates}
                      value={beardSelections[i] || defaultBeardTemplate}
                      onChange={(id) =>
                        setBeardSelections((prev) =>
                          prev.map((x, idx) => (idx === i ? id : x))
                        )
                      }
                    />
                  ))}
                </div>
              )}

              <p className="mt-4 text-center text-xs text-ink-muted">
                PNG, JPG or WEBP · up to 10 MB each
              </p>
            </div>

            <div className="card rounded-2xl p-5 sm:rounded-3xl sm:p-8">
              <SectionHead n={3} title="Choose your pack" />
              <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 sm:grid-cols-2">
                {packs.length === 0 && (
                  <>
                    <div className="h-[132px] animate-pulse rounded-2xl bg-ink/5 dark:bg-white/5" />
                    <div className="h-[132px] animate-pulse rounded-2xl bg-ink/5 dark:bg-white/5" />
                  </>
                )}
                {packs.map((p) => {
                  const selected = packId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPackId(p.id)}
                      className={`relative flex flex-col rounded-2xl border p-5 text-left transition ${
                        selected
                          ? "border-sage bg-sage/5 shadow-sm ring-2 ring-sage/25 dark:bg-sage/10 dark:ring-sage/35"
                          : "border-ink/10 bg-white/70 hover:border-sage/40 hover:shadow-md dark:border-white/10 dark:bg-[#181511] dark:hover:border-sage/55 dark:hover:bg-[#1d1914]"
                      }`}
                    >
                      {selected && (
                        <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-sage text-xs font-bold text-paper">
                          ✓
                        </span>
                      )}
                      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-sage">
                        {p.label}
                      </span>
                      <span className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl">
                        KES {p.amountKes ?? p.amount} · ₹{p.amountInr ?? "—"}
                      </span>
                      <span className="mt-1 text-sm text-ink-muted">
                        {p.images} look{p.images > 1 ? "s" : ""} → {p.images}{" "}
                        styled result{p.images > 1 ? "s" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="card rounded-2xl p-5 sm:rounded-3xl sm:p-6">
              <h3 className="font-display text-lg font-semibold text-ink">
                Price details
              </h3>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">Pack</dt>
                  <dd className="font-medium text-ink">
                    {selectedPack?.label ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">Styled results</dt>
                  <dd className="font-medium text-ink">
                    {targetCount} image{targetCount > 1 ? "s" : ""}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">Delivery</dt>
                  <dd className="font-semibold text-sage-dark">FREE</dd>
                </div>
              </dl>
              <div className="my-4 h-px bg-ink/10" />
              {couponQuote && payableAmount !== displayAmount && (
                <div className="mb-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between text-ink-muted">
                    <span>Subtotal</span>
                    <span>
                      {displayCurrency} {displayAmount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sage-dark">
                    <span>Coupon: {couponQuote.coupon.code}</span>
                    <span>−{displayCurrency} {couponQuote.discountAmount}</span>
                  </div>
                </div>
              )}
              <div className="flex items-end justify-between">
                <span className="text-sm font-semibold text-ink">
                  Total payable
                </span>
                <span className="font-display text-2xl font-semibold text-ink">
                  {selectedPack
                    ? `${displayCurrency} ${payableAmount}`
                    : "—"}
                </span>
              </div>

              <CheckoutCoupon
                packId={packId}
                amount={typeof displayAmount === "number" ? displayAmount : Number(displayAmount)}
                currency={displayCurrency}
                quote={couponQuote}
                onQuote={(q, code) => {
                  setCouponQuote(q);
                  setCouponCode(code);
                }}
              />

              {isFreeCheckout && (
                <p className="mt-3 rounded-xl bg-sage/10 px-3 py-2 text-xs font-medium text-sage-dark">
                  Welcome offer applied — your first Single pack try-on is free
                  (limited to the first 1,000 shoppers).
                </p>
              )}

              {freeTryons > 0 && !isFreeCheckout && (
                <p className="mt-3 rounded-xl bg-sage/10 px-3 py-2 text-xs font-medium text-sage-dark">
                  You have {freeTryons} free try-on
                  {freeTryons === 1 ? "" : "s"} from referrals
                  {targetCount === 1
                    ? " — redeem on this Single pack."
                    : " — switch to Single pack to redeem."}
                </p>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {paymentNotice && (
                <div className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
                  {paymentNotice}
                </div>
              )}

              {(allowGatewayChoice ||
                (mpesaEnabled && razorpayEnabled)) && (
                <div className="mt-4 space-y-2">
                  <span className="text-sm font-medium text-ink">
                    Pay with
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {mpesaEnabled && (
                      <button
                        type="button"
                        onClick={() => setSelectedGateway("mpesa")}
                        className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                          payGateway === "mpesa"
                            ? "border-sage bg-sage/10 font-semibold text-sage-dark"
                            : "border-ink/15 text-ink hover:border-sage/40"
                        }`}
                      >
                        M-Pesa
                        <span className="mt-0.5 block text-xs font-normal text-ink-muted">
                          Kenya · KES
                        </span>
                      </button>
                    )}
                    {razorpayEnabled && (
                      <button
                        type="button"
                        onClick={() => setSelectedGateway("razorpay")}
                        className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                          payGateway === "razorpay"
                            ? "border-sage bg-sage/10 font-semibold text-sage-dark"
                            : "border-ink/15 text-ink hover:border-sage/40"
                        }`}
                      >
                        Razorpay
                        <span className="mt-0.5 block text-xs font-normal text-ink-muted">
                          India · INR · UPI / card
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {needsMpesaPhone && (
                <label className="mt-4 block text-sm">
                  <span className="font-medium text-ink">M-Pesa phone</span>
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="07XX XXX XXX"
                    className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-ink outline-none focus:border-sage dark:border-white/15 dark:bg-[#12100e]"
                  />
                  <span className="mt-1 block text-xs text-ink-muted">
                    Safaricom number that will receive the STK PIN prompt
                  </span>
                </label>
              )}

              <button
                onClick={() => handleSubmit(false)}
                disabled={!canSubmit}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-sage py-4 text-base font-semibold text-paper shadow-lg shadow-sage/20 transition hover:bg-sage-dark hover:shadow-sage/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {stage === "working" && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
                )}
                {stage === "working"
                  ? "Processing…"
                  : selectedPack
                    ? isFreeCheckout
                      ? "Start free try-on"
                      : needsMpesaPhone
                        ? `Pay with M-Pesa · ${displayCurrency} ${payableAmount}`
                        : payWithRazorpay
                          ? `Pay with Razorpay · ${displayCurrency} ${payableAmount}`
                          : `Pay ${displayCurrency} ${payableAmount}`
                    : "Pay & Render"}
              </button>

              {freeTryons > 0 && targetCount === 1 && !isFreeCheckout && (
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={!canSubmit}
                  className="mt-2 flex w-full items-center justify-center rounded-full border border-sage/40 bg-white py-3 text-sm font-semibold text-sage-dark transition hover:bg-sage/10 disabled:opacity-50 dark:bg-[#181511] dark:text-[#d7cfbf] dark:hover:bg-sage/15"
                >
                  Redeem 1 free try-on
                </button>
              )}
              {!canSubmit && stage !== "working" && (
                <p className="mt-2 text-center text-xs text-ink-muted">
                  Add your selfie and all {uploadCopy.targetWord} photos to
                  continue.
                </p>
              )}
              {defaultGateway === "stub" && (
                <p className="mt-3 text-center text-[11px] text-ink-muted/80">
                  Demo payment completes instantly on this device. Photos used only
                  for this render.
                </p>
              )}
            </div>

            <div className="card rounded-3xl p-6">
              <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted">
                What&apos;s included
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-ink">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-sage">✓</span>
                  High-resolution renders
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-sage">✓</span>
                  Instant delivery — download right away
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-sage">✓</span>
                  Saved to your History after render
                </li>
              </ul>
            </div>
          </aside>
        </div>
      )}

      {stage === "processing" && (
        <div className="mt-10 flex flex-col items-center text-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
          <h3 className="mt-6 font-display text-2xl font-semibold text-ink">
            Rendering your look…
          </h3>
          <p className="mt-2 text-ink-muted">
            We&apos;re styling your try-on. This takes a few seconds.
          </p>
        </div>
      )}

      {stage === "done" && job && (
        <div className="mx-auto">
          <TryOnResultReady
            resultImageUrls={job.resultImageUrls}
            badge={
              job.pack
                ? `${job.pack} pack`
                : selectedPack
                  ? `${selectedPack.label} pack`
                  : null
            }
            onTryAnother={reset}
            challengePath="/app/try-on"
          />
        </div>
      )}

      {stage === "error" && (
        <div className="mt-10 text-center">
          <div className="mx-auto max-w-md rounded-2xl border border-red-300/60 bg-red-50 px-6 py-5 text-left text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
            <p className="font-semibold text-base">Payment or render error</p>
            <p className="mt-2 leading-relaxed">{error || "Something went wrong."}</p>
          </div>
          <button
            onClick={() => {
              setCouponQuote(null);
              setCouponCode("");
              setWelcomeRefreshKey((k) => k + 1);
              setStage("form");
            }}
            className="mt-6 rounded-full bg-sage px-8 py-3 font-semibold text-paper transition hover:bg-sage-dark"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
