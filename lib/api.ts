import * as Sentry from "@sentry/nextjs";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

async function handle<T>(res: Response, path: string): Promise<T> {
  if (!res.ok) {
    let message = `${res.status}`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      // ignore
    }
    // Leave a trail for Sentry so failed requests have request context.
    Sentry.addBreadcrumb({
      category: "api",
      level: res.status >= 500 ? "error" : "warning",
      message: `${res.status} ${path}`,
      data: { path, status: res.status },
    });
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
  return handle<T>(res, path);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handle<T>(res, path);
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  token?: string
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handle<T>(res, path);
}

export async function apiPut<T>(
  path: string,
  body: unknown,
  token?: string
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handle<T>(res, path);
}

export async function apiDelete<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return handle<T>(res, path);
}

export async function apiPostForm<T>(
  path: string,
  form: FormData,
  token?: string
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  return handle<T>(res, path);
}

export async function apiSendForm<T>(
  method: "POST" | "PATCH",
  path: string,
  form: FormData,
  token?: string
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  return handle<T>(res, path);
}

// Turns a relative API path (e.g. /uploads/x.png) into an absolute URL.
export function apiUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return pathOrUrl;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${API_BASE}${pathOrUrl}`;
}

function triggerAnchorDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Forces the browser to save an image to the user's machine instead of
 * navigating to it. The plain `download` attribute is ignored for
 * cross-origin URLs (e.g. Cloudinary), so we either use Cloudinary's
 * `fl_attachment` flag or fetch the bytes as a blob.
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  const abs = apiUrl(url);

  // Cloudinary: inject fl_attachment so the CDN sends Content-Disposition:
  // attachment. This downloads reliably with no CORS constraints.
  if (/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\//.test(abs)) {
    const base = filename.replace(/\.[^./]+$/, "");
    const forced = abs.replace(
      /\/upload\//,
      `/upload/fl_attachment:${encodeURIComponent(base)}/`
    );
    triggerAnchorDownload(forced, filename);
    return;
  }

  // Everything else: fetch the bytes and save the blob.
  try {
    const res = await fetch(abs);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerAnchorDownload(objectUrl, filename);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
  } catch {
    // Last resort: open in a new tab so the image isn't lost.
    window.open(abs, "_blank", "noopener,noreferrer");
  }
}

export { API_BASE };
