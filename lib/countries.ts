/** Billing currencies (ISO 4217) and payment hints. */
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

export function paymentHintForCurrency(code: string | undefined | null): string {
  const found = CURRENCIES.find((c) => c.code === code);
  return found?.paymentHint || "Card / local methods";
}

export {
  COUNTRIES,
  PHONE_COUNTRIES,
  countrySelectOptions,
  phoneDialOptions,
  currencyForCountry,
  matchCountry,
  getCountryByName,
  dialCodeForCountry,
  detectCountryFromPhone,
  parsePhoneNumber,
} from "./phoneCountries";

export type { CountryName, PhoneCountry } from "./phoneCountries";
