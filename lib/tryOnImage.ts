export const MIN_TRYON_IMAGE_PX = 321;

export function readImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

export function tryOnImageTooSmall(width: number, height: number) {
  return width <= MIN_TRYON_IMAGE_PX || height <= MIN_TRYON_IMAGE_PX;
}

export function tryOnImageSizeMessage(width: number, height: number) {
  return `Photo must be at least ${MIN_TRYON_IMAGE_PX + 1}×${MIN_TRYON_IMAGE_PX + 1} pixels (yours is ${width}×${height}). Use a higher resolution image.`;
}

export function friendlyTryOnError(message?: string | null) {
  if (!message) return "Rendering failed. Please try again.";
  const lower = message.toLowerCase();
  if (lower.includes("320px") || lower.includes("width and height")) {
    return "One of the photos is too small. Use images at least 321×321 pixels for both the customer photo and product image.";
  }
  if (lower.includes("publicly accessible") || lower.includes("cloudinary")) {
    return "Images could not be accessed by the render service. Check Cloudinary storage settings.";
  }
  return message;
}
