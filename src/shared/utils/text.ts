/** Texte comparable pour une recherche : minuscules, sans accents, espaces réduits. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Vrai si chaque mot de `query` figure dans `normalizedText` (déjà passé par `normalizeSearchText`). */
export function matchesSearchQuery(normalizedText: string, query: string): boolean {
  const words = normalizeSearchText(query).split(' ').filter(Boolean);
  return words.every((word) => normalizedText.includes(word));
}
