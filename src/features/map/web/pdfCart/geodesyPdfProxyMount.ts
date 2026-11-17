import { DEFAULT_GEODESY_PDF_FETCH_PROXY_PATH } from '@ign/gdp-tools';

/** Montage same-origin du proxy PDF (aligné sur `vite.config` / `VITE_BASE_PATH`). */
export function getGeodesyPdfProxyMountPath(): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '');
  return `${base}${DEFAULT_GEODESY_PDF_FETCH_PROXY_PATH}`;
}
