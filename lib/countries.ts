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

/** Map Google Places country names onto our dropdown values when possible. */
export function matchCountry(name: string | undefined | null): string {
  if (!name) return "";
  const trimmed = name.trim();
  const exact = COUNTRIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  // Common Google aliases
  const aliases: Record<string, CountryName> = {
    usa: "United States",
    "united states of america": "United States",
    uk: "United Kingdom",
    "great britain": "United Kingdom",
    uae: "United Arab Emirates",
  };
  return aliases[trimmed.toLowerCase()] || "Other";
}
