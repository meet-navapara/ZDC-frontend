"use client";

import { useState } from "react";
import { apiUrl, downloadImage } from "@/lib/api";

type Props = {
  /** Relative or absolute URL of the result image to act on. */
  imageUrl: string;
  filename?: string;
  /** Reset / start a new look. */
  onTryAnother?: () => void;
  /** Link shared in challenge invites. Defaults to the consumer try-on studio. */
  challengePath?: string;
  /** Compact studio layout — does not change the default share grid. */
  variant?: "default" | "studio";
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

async function shareImageToInstagram(absUrl: string, filename: string) {
  // Instagram has no web share deep-link for images. Prefer the system share
  // sheet (mobile) so the user can pick Instagram Stories / feed; otherwise
  // download the file and open Instagram so they can upload manually.
  try {
    const res = await fetch(absUrl);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const file = new File([blob], filename, {
      type: blob.type || "image/png",
    });

    if (
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      (!("canShare" in navigator) ||
        (navigator as Navigator).canShare?.({ files: [file] }))
    ) {
      await navigator.share({
        files: [file],
        title: "My zimji try-on",
        text: "Check out my AI try-on look!",
      });
      return;
    }
  } catch {
    // fall through
  }

  await downloadImage(absUrl, filename);
  window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
}

export function TryOnShareActions({
  imageUrl,
  filename = "zimji-tryon.png",
  onTryAnother,
  challengePath = "/app/try-on",
  variant = "default",
}: Props) {
  const [toast, setToast] = useState("");

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }

  const absImage = apiUrl(imageUrl);
  const siteOrigin =
    typeof window !== "undefined" ? window.location.origin : "";
  const challengeUrl = `${siteOrigin}${challengePath}`;

  async function handleDownload() {
    await downloadImage(imageUrl, filename);
    flash("Download started");
  }

  function handleWhatsApp() {
    const text = `Check out my AI try-on look! ${absImage}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function handleInstagram() {
    flash("Opening share…");
    await shareImageToInstagram(absImage, filename);
  }

  async function handleCopyLink() {
    const ok = await copyText(absImage);
    flash(ok ? "Link copied" : "Could not copy — try again");
  }

  function handleChallenge() {
    const text = `I just tried on a new look with zimji AI — can you beat mine? Challenge accepted? ${challengeUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const actions: {
    key: string;
    label: string;
    onClick: () => void | Promise<void>;
    primary?: boolean;
  }[] = [
    { key: "download", label: "Download", onClick: handleDownload, primary: true },
    { key: "whatsapp", label: "Share to WhatsApp", onClick: handleWhatsApp },
    { key: "instagram", label: "Share to Instagram", onClick: handleInstagram },
    { key: "copy", label: "Copy link", onClick: handleCopyLink },
    ...(onTryAnother
      ? [
          {
            key: "another",
            label: "Try another look",
            onClick: onTryAnother,
          },
        ]
      : []),
    { key: "challenge", label: "Challenge a friend", onClick: handleChallenge },
  ];

  const studio = variant === "studio";

  return (
    <div className={`relative ${studio ? "mt-0 w-full" : "mt-8"}`}>
      {studio ? (
        <div className="flex w-full flex-col gap-1.5">
          {actions.map((a, i) => (
            <button
              key={a.key}
              type="button"
              onClick={() => void a.onClick()}
              style={{ animationDelay: `${420 + i * 40}ms` }}
              className={
                a.primary
                  ? "w-full animate-fadeUp rounded-full bg-sage px-3 py-1.5 text-[11px] font-semibold tracking-wide text-paper shadow-[0_10px_22px_-12px_rgba(92,122,104,1)] transition hover:bg-sage-dark sm:py-2 sm:text-xs"
                  : "w-full animate-fadeUp rounded-full border border-ink/10 bg-white/30 px-3 py-1.5 text-[11px] font-medium tracking-wide text-ink/90 transition hover:border-sage/45 hover:bg-sage/10 hover:text-sage-dark dark:border-white/12 dark:bg-white/[0.03] dark:text-[#e8e2d8] dark:hover:border-sage/40 dark:hover:bg-white/5 sm:py-2 sm:text-xs"
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {actions.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => void a.onClick()}
              className={
                a.primary
                  ? "rounded-full bg-sage px-5 py-3 text-sm font-semibold uppercase tracking-wide text-paper transition hover:bg-sage-dark"
                  : "rounded-full border border-ink/15 bg-white/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-ink transition hover:border-ink/30 hover:bg-white"
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {toast && (
        <p
          role="status"
          className="pointer-events-none mt-4 text-center text-xs font-semibold text-sage-dark sm:absolute sm:-bottom-10 sm:left-1/2 sm:mt-0 sm:-translate-x-1/2 sm:whitespace-nowrap sm:rounded-full sm:bg-ink sm:px-4 sm:py-1.5 sm:text-paper sm:shadow-lg"
        >
          {toast}
        </p>
      )}
    </div>
  );
}
