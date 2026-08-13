// Input length limits mirrored from the backend validators so the UI can stop
// users before a request is rejected. The backend remains the source of truth.
export const LIMITS = {
  email: 254,
  password: 128,
  name: 80,
  phone: 30,
  businessName: 120,
  addressLine: 200,
  city: 100,
  country: 100,
  categoryName: 80,
  description: 2000,
  shortDescription: 500,
  productName: 140,
  sku: 60,
  currency: 8,
  packLabel: 60,
  url: 2048,
  branchName: 120,
} as const;

export const MAX_BRANCH_COUNT = 20;
