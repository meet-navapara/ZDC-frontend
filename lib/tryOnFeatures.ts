/** Canonical try-on feature names — shared across B2B, B2C, and admin UI. */
export type TryOnFeatureId = "cloth" | "hair" | "haircolor" | "beard";

export type TryOnFeatureMeta = {
  id: TryOnFeatureId;
  /** Primary label (chips, dropdowns, tabs). */
  label: string;
  /** Compact label for tight UI. */
  shortLabel: string;
  /** One-line SEO / helper copy. */
  tagline: string;
  needsReferenceImage: boolean;
};

export const TRY_ON_FEATURES: TryOnFeatureMeta[] = [
  {
    id: "cloth",
    label: "AI Outfit Try-On",
    shortLabel: "Outfit",
    tagline: "Virtual clothing try-on on customer photos",
    needsReferenceImage: true,
  },
  {
    id: "hair",
    label: "AI Hairstyle Try-On",
    shortLabel: "Hairstyle",
    tagline: "Virtual hairstyle preview from a reference photo",
    needsReferenceImage: true,
  },
  {
    id: "haircolor",
    label: "AI Hair Color Try-On",
    shortLabel: "Hair Color",
    tagline: "Virtual hair color preview on a selfie",
    needsReferenceImage: false,
  },
  {
    id: "beard",
    label: "AI Beard Try-On",
    shortLabel: "Beard",
    tagline: "Virtual beard style preview on a selfie",
    needsReferenceImage: false,
  },
];

export function tryOnFeatureLabel(
  feature: TryOnFeatureId | string | undefined
): string {
  return (
    TRY_ON_FEATURES.find((f) => f.id === feature)?.label ??
    "AI Outfit Try-On"
  );
}

export function tryOnFeatureShortLabel(
  feature: TryOnFeatureId | string | undefined
): string {
  return (
    TRY_ON_FEATURES.find((f) => f.id === feature)?.shortLabel ?? "Outfit"
  );
}

export function tryOnFeatureTagline(
  feature: TryOnFeatureId | string | undefined
): string {
  return (
    TRY_ON_FEATURES.find((f) => f.id === feature)?.tagline ??
    "Virtual try-on on customer photos"
  );
}

export function tryOnFeatureNeedsReference(
  feature: TryOnFeatureId | string | undefined
): boolean {
  const id = feature as TryOnFeatureId;
  return (
    TRY_ON_FEATURES.find((f) => f.id === id)?.needsReferenceImage ?? true
  );
}

/** Legacy export shape used by b2b catalog helpers. */
export const TRY_ON_FEATURE_OPTIONS = TRY_ON_FEATURES.map((f) => ({
  id: f.id,
  label: f.label,
}));
