export function getColorCode(colorName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${colorName}`)
    .trim();
}
