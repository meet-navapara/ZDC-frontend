/** Kenya M-Pesa phone helpers (Safaricom 07… / 2547…). */

export function normalizeKenyaMsisdn(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/[^\d+]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  s = s.replace(/\D/g, "");

  if (s.startsWith("254") && s.length >= 12) return s.slice(0, 12);
  if (s.startsWith("0") && s.length >= 10) return `254${s.slice(1, 10)}`;
  if (s.startsWith("7") && s.length === 9) return `254${s}`;
  if (s.startsWith("1") && s.length === 9) return `254${s}`;
  return null;
}

export function isValidMpesaPhone(raw: string | null | undefined): boolean {
  const n = normalizeKenyaMsisdn(raw);
  return Boolean(n && /^254[17]\d{8}$/.test(n));
}
