/**
 * L'API Espace collaboratif renvoie le total paginé dans `Content-Range`
 * (ex. `0-0/12` ou `items 0-9/47`).
 */
export function parseReportsTotal(contentRange: unknown, fallbackCount: number): number {
  if (typeof contentRange !== 'string') {
    return fallbackCount;
  }

  const totalPart = contentRange.split('/').at(-1)?.trim();
  const total = Number(totalPart);

  return Number.isFinite(total) ? total : fallbackCount;
}
