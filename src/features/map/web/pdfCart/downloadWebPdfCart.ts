import {
  MergeGeodesyPdfUrlsError,
  buildMergedGeodesyPdfFilename,
  createGeodesyPdfFetchWithProxyFallback,
  mergeGeodesyPdfUrls,
  triggerBrowserPdfDownload,
} from '@ign/gdp-tools';

import { getGeodesyPdfProxyMountPath } from './geodesyPdfProxyMount';
import type { WebPdfCartEntry } from './pdfCartTypes';

export interface DownloadWebPdfCartResult {
  mergedCount: number;
  skippedCount: number;
}

export async function downloadWebPdfCart(
  entries: readonly WebPdfCartEntry[],
  options: { signal?: AbortSignal } = {},
): Promise<DownloadWebPdfCartResult> {
  const urls = entries.map((entry) => entry.pdfUrl).filter((url): url is string => Boolean(url?.trim()));

  if (urls.length === 0) {
    throw new MergeGeodesyPdfUrlsError('Aucune fiche PDF dans le panier.');
  }

  const fetchPdf = createGeodesyPdfFetchWithProxyFallback(getGeodesyPdfProxyMountPath());
  const { pdfBytes, mergedCount, skipped } = await mergeGeodesyPdfUrls({
    urls,
    fetchPdf,
    signal: options.signal,
  });

  triggerBrowserPdfDownload(pdfBytes, buildMergedGeodesyPdfFilename());

  return {
    mergedCount,
    skippedCount: skipped.length,
  };
}
