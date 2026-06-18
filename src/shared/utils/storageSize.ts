export function formatSizeFromBytes(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes.toLocaleString('fr-FR')} o`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toLocaleString('fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} Ko`;
  }

  return `${(sizeBytes / 1024 / 1024).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Mo`;
}
