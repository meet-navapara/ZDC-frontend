/** Canonical B2B business type labels — signup + read-only profile display. */
export type BusinessCategoryId = "boutique" | "salon";

export type BusinessCategoryMeta = {
  id: BusinessCategoryId;
  /** Primary label (dropdowns, read-only fields). */
  label: string;
  /** One-line helper for signup / settings. */
  description: string;
};

export const BUSINESS_CATEGORIES: BusinessCategoryMeta[] = [
  {
    id: "boutique",
    label: "Fashion boutique",
    description: "Upload outfits and run AI virtual outfit try-on for customers.",
  },
  {
    id: "salon",
    label: "Hair salon",
    description:
      "Upload hairstyles in Catalog; AI hair color and beard try-on are built-in on Try-On.",
  },
];

export const BUSINESS_TYPE_FIELD_LABEL = "Business type";

export function businessCategoryLabel(
  category: BusinessCategoryId | string | undefined | null
): string {
  const id = String(category || "boutique").trim().toLowerCase();
  return (
    BUSINESS_CATEGORIES.find((c) => c.id === id)?.label ??
    (id === "salon" ? "Hair salon" : "Fashion boutique")
  );
}

export function businessCategoryDescription(
  category: BusinessCategoryId | string | undefined | null
): string {
  const id = String(category || "boutique").trim().toLowerCase();
  return (
    BUSINESS_CATEGORIES.find((c) => c.id === id)?.description ??
    BUSINESS_CATEGORIES[0].description
  );
}

export function normalizeBusinessCategory(
  category: string | undefined | null
): BusinessCategoryId {
  return String(category || "").trim().toLowerCase() === "salon"
    ? "salon"
    : "boutique";
}

export const BUSINESS_CATEGORY_SELECT_OPTIONS = BUSINESS_CATEGORIES.map((c) => ({
  value: c.id,
  label: c.label,
}));
