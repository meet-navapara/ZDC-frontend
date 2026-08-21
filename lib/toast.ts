export type ToastType = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
};

type Listener = (toast: ToastItem) => void;

const listeners = new Set<Listener>();

function emit(toast: ToastItem) {
  listeners.forEach((fn) => fn(toast));
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function push(message: string, type: ToastType, duration = 3200) {
  const text = String(message || "").trim();
  if (!text) return;
  emit({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message: text.slice(0, 220),
    type,
    duration,
  });
}

/** Global toast helpers — works from any client component / handler. */
export const toast = {
  success: (message: string, duration?: number) =>
    push(message, "success", duration ?? 3200),
  error: (message: string, duration?: number) =>
    push(message, "error", duration ?? 4200),
  info: (message: string, duration?: number) =>
    push(message, "info", duration ?? 3200),
};
