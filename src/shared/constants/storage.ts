export const STORAGE_PREFIX = 'GDP';

export function storageKey(key: string): string {
  return `${STORAGE_PREFIX}_${key}`;
}
