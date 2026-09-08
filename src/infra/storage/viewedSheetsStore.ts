import { Storage } from '@ign/mobile-device';

import { storageKey } from '@/shared/constants/storage';

const VIEWED_SHEETS_KEY = storageKey('VIEWED_SHEETS');

type ViewedSheetsByUser = Record<string, Record<string, number>>;

const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeViewedSheets(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isSheetMap(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((timestamp) => typeof timestamp === 'number');
}

function isViewedSheetsByUser(value: unknown): value is ViewedSheetsByUser {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(isSheetMap);
}

async function readAll(): Promise<ViewedSheetsByUser> {
  const stored = await Storage.get(VIEWED_SHEETS_KEY, 'object');
  return isViewedSheetsByUser(stored) ? stored : {};
}

export async function getViewedSheetsCount(userId: number): Promise<number> {
  const all = await readAll();
  return Object.keys(all[String(userId)] ?? {}).length;
}

export async function trackViewedSheet(userId: number, sheetId: string): Promise<boolean> {
  const normalizedId = sheetId.trim();
  if (!normalizedId) {
    return false;
  }

  const all = await readAll();
  const userKey = String(userId);
  const current = all[userKey] ?? {};

  if (current[normalizedId] !== undefined) {
    return false;
  }

  all[userKey] = {
    ...current,
    [normalizedId]: Date.now(),
  };

  await Storage.set(VIEWED_SHEETS_KEY, all, 'object');
  emitChange();
  return true;
}

export async function resetViewedSheets(userId: number): Promise<void> {
  const all = await readAll();
  const userKey = String(userId);

  if (all[userKey] === undefined) {
    emitChange();
    return;
  }

  delete all[userKey];
  await Storage.set(VIEWED_SHEETS_KEY, all, 'object');
  emitChange();
}
