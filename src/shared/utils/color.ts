/** Lit une variable `--color-{name}` définie dans `src/styles/global.css`. */
export function getColorCode(colorName: string): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${colorName}`)
    .trim();

  if (!raw) {
    return '';
  }

  // Les marqueurs OpenLayers sont des SVG en data-URI : `var(--…)` n'y est pas résolu.
  if (!raw.includes('var(')) {
    return raw;
  }

  const probe = document.createElement('span');
  probe.style.color = raw;
  document.documentElement.appendChild(probe);
  const resolved = getComputedStyle(probe).color.trim();
  probe.remove();

  return resolved || raw;
}
