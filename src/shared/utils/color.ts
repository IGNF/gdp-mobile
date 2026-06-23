/** Lit une variable `--color-{name}` définie dans `src/styles/global.css`. */
export function getColorCode(colorName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${colorName}`)
    .trim();
}
