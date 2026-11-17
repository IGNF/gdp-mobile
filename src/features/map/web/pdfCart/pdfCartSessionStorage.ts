import type { WebPdfCartEntry } from './pdfCartTypes';
import { WEB_PDF_CART_SESSION_STORAGE_KEY } from './pdfCartConstants';

function isWebPdfCartEntry(value: unknown): value is WebPdfCartEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entry = value as WebPdfCartEntry;
  return (
    typeof entry.key === 'string' &&
    typeof entry.title === 'string' &&
    typeof entry.longitude === 'number' &&
    typeof entry.latitude === 'number'
  );
}

export function loadPdfCartFromSessionStorage(): WebPdfCartEntry[] {
  if (typeof sessionStorage === 'undefined') {
    return [];
  }

  try {
    const raw = sessionStorage.getItem(WEB_PDF_CART_SESSION_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isWebPdfCartEntry);
  } catch {
    return [];
  }
}

export function savePdfCartToSessionStorage(entries: readonly WebPdfCartEntry[]): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  try {
    sessionStorage.setItem(WEB_PDF_CART_SESSION_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota dépassé ou navigation privée : on ignore.
  }
}

export function clearPdfCartSessionStorage(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  sessionStorage.removeItem(WEB_PDF_CART_SESSION_STORAGE_KEY);
}
