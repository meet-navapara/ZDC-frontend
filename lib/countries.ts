/** Countries for B2B registration / settings dropdowns. */
export const COUNTRIES = [
  "Kenya",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Ethiopia",
  "Nigeria",
  "Ghana",
  "South Africa",
  "India",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Netherlands",
  "Singapore",
  "Malaysia",
  "Philippines",
  "Indonesia",
  "Pakistan",
  "Bangladesh",
  "Egypt",
  "Morocco",
  "Other",
] as const;

export type CountryName = (typeof COUNTRIES)[number];

/** Supported billing currencies (ISO 4217). */
export const CURRENCIES = [
  { code: "KES", label: "KES — Kenyan Shilling", paymentHint: "M-Pesa" },
  { code: "UGX", label: "UGX — Ugandan Shilling", paymentHint: "Mobile money / card" },
  { code: "TZS", label: "TZS — Tanzanian Shilling", paymentHint: "Mobile money / card" },
  { code: "RWF", label: "RWF — Rwandan Franc", paymentHint: "Mobile money / card" },
  { code: "ETB", label: "ETB — Ethiopian Birr", paymentHint: "Card / bank" },
  { code: "NGN", label: "NGN — Nigerian Naira", paymentHint: "Card / bank transfer" },
  { code: "GHS", label: "GHS — Ghanaian Cedi", paymentHint: "Mobile money / card" },
  { code: "ZAR", label: "ZAR — South African Rand", paymentHint: "Card / EFT" },
  { code: "INR", label: "INR — Indian Rupee", paymentHint: "Razorpay (UPI / card)" },
  { code: "AED", label: "AED — UAE Dirham", paymentHint: "Card" },
  { code: "GBP", label: "GBP — British Pound", paymentHint: "Card" },
  { code: "USD", label: "USD — US Dollar", paymentHint: "Card" },
  { code: "CAD", label: "CAD — Canadian Dollar", paymentHint: "Card" },
  { code: "AUD", label: "AUD — Australian Dollar", paymentHint: "Card" },
  { code: "EUR", label: "EUR — Euro", paymentHint: "Card" },
  { code: "SGD", label: "SGD — Singapore Dollar", paymentHint: "Card" },
  { code: "MYR", label: "MYR — Malaysian Ringgit", paymentHint: "Card" },
  { code: "PHP", label: "PHP — Philippine Peso", paymentHint: "Card" },
  { code: "IDR", label: "IDR — Indonesian Rupiah", paymentHint: "Card" },
  { code: "PKR", label: "PKR — Pakistani Rupee", paymentHint: "Card / bank" },
  { code: "BDT", label: "BDT — Bangladeshi Taka", paymentHint: "Card / bank" },
  { code: "EGP", label: "EGP — Egyptian Pound", paymentHint: "Card" },
  { code: "MAD", label: "MAD — Moroccan Dirham", paymentHint: "Card" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as CurrencyCode[];

const COUNTRY_CURRENCY: Record<CountryName, CurrencyCode> = {
  Kenya: "KES",
  Uganda: "UGX",
  Tanzania: "TZS",
  Rwanda: "RWF",
  Ethiopia: "ETB",
  Nigeria: "NGN",
  Ghana: "GHS",
  "South Africa": "ZAR",
  India: "INR",
  "United Arab Emirates": "AED",
  "United Kingdom": "GBP",
  "United States": "USD",
  Canada: "CAD",
  Australia: "AUD",
  Germany: "EUR",
  France: "EUR",
  Netherlands: "EUR",
  Singapore: "SGD",
  Malaysia: "MYR",
  Philippines: "PHP",
  Indonesia: "IDR",
  Pakistan: "PKR",
  Bangladesh: "BDT",
  Egypt: "EGP",
  Morocco: "MAD",
  Other: "USD",
};

/** Default currency for a country (falls back to USD). */
export function currencyForCountry(country: string | undefined | null): CurrencyCode {
  if (!country) return "USD";
  const matched = matchCountry(country) as CountryName;
  return COUNTRY_CURRENCY[matched] || "USD";
}

export function paymentHintForCurrency(code: string | undefined | null): string {
  const found = CURRENCIES.find((c) => c.code === code);
  return found?.paymentHint || "Card / local methods";
}

/** Map Google Places country names onto our dropdown values when possible. */
export function matchCountry(name: string | undefined | null): string {
  if (!name) return "";
  const trimmed = name.trim();
  const exact = COUNTRIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  const aliases: Record<string, CountryName> = {
    usa: "United States",
    "united states of america": "United States",
    uk: "United Kingdom",
    "great britain": "United Kingdom",
    uae: "United Arab Emirates",
  };
  return aliases[trimmed.toLowerCase()] || "Other";
}
