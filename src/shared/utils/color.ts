/**
 * Résout une valeur CSS de couleur (ex. `var(--color-primary)`, `rgba(var(--color-danger-rgb), 0.14)`)
 * en couleur calculée. Nécessaire pour les marqueurs OpenLayers : ce sont des SVG en data-URI,
 * où `var(--…)` n'est pas résolu.
 */
export function resolveCssColor(value: string): string {
  const raw = value.trim();
  if (!raw) {
    return '';
  }

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

/** Lit une variable `--color-{name}` définie dans `src/styles/global.css`. */
export function getColorCode(colorName: string): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${colorName}`)
    .trim();

  if (!raw) {
    return '';
  }

  return resolveCssColor(raw);
}
