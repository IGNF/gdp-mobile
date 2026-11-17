import { GeodesyPointTitle } from '@ign/gdp-tools/react';
import { useCallback, useState } from 'react';

import { MapOverlaySheet } from '@/features/map/components/MapOverlaySheet';
import { trackPointPdfOpen } from '@/infra/analytics/matomo';
import { Button } from '@/shared/ui/Button';
import IconDelete from '@/shared/assets/icons/icon-delete.svg?react';
import IconPdf from '@/shared/assets/icons/icon-pdf.svg?react';

import { WEB_PDF_CART_MAX_ENTRIES } from './pdfCartConstants';
import { useWebPdfCart } from './useWebPdfCart';
import type { WebPdfCartEntry } from './pdfCartTypes';

import styles from './WebPdfCartPanel.module.css';

export interface WebPdfCartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntry: (entry: WebPdfCartEntry) => void;
}

export function WebPdfCartPanel({
  isOpen,
  onClose,
  onSelectEntry,
}: WebPdfCartPanelProps) {
  const { entries, count, remove, clear } = useWebPdfCart();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const pdfCount = entries.filter((entry) => Boolean(entry.pdfUrl?.trim())).length;

  const handleDownload = useCallback(async () => {
    if (pdfCount === 0 || isDownloading) {
      return;
    }

    setDownloadError(null);
    setIsDownloading(true);

    try {
      const { downloadWebPdfCart } = await import('./downloadWebPdfCart');
      await downloadWebPdfCart(entries);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Impossible de générer le PDF fusionné.';
      setDownloadError(message);
    } finally {
      setIsDownloading(false);
    }
  }, [entries, isDownloading, pdfCount]);

  const footer = (
    <div className={styles.footer}>
      <Button type="button" variant="outline" fullWidth disabled={count === 0} onClick={() => clear()}>
        Vider le panier
      </Button>
      <Button
        type="button"
        fullWidth
        disabled={pdfCount === 0 || isDownloading}
        onClick={() => void handleDownload()}
      >
        {isDownloading ? 'Téléchargement…' : 'Télécharger les PDF'}
      </Button>
    </div>
  );

  return (
    <MapOverlaySheet
      isOpen={isOpen}
      onClose={onClose}
      title="Panier PDF"
      titleBadge={count > 0 ? count : undefined}
      size="large"
      draggable
      ariaLabel="Panier de repères pour export PDF"
      allowMapInteraction
      footer={footer}
    >
      <p className={styles.intro}>
        Sur la carte, maintenez{' '}
        <kbd className={styles.kbd}>Maj</kbd> puis tracez un rectangle (tuiles WMS / GetFeatureInfo).
        Maximum {WEB_PDF_CART_MAX_ENTRIES} repères.
      </p>

      {downloadError ? (
        <p className={styles.downloadError} role="alert">
          {downloadError}
        </p>
      ) : null}

      {count === 0 ? (
        <p className={styles.empty}>
          Le panier est vide. Sélectionnez une zone avec{' '}
          <kbd className={styles.kbd}>Maj</kbd> + rectangle.
        </p>
      ) : (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.key} className={styles.row}>
              <div className={styles.rowBody}>
                <button
                  type="button"
                  className={styles.rowMain}
                  onClick={() => onSelectEntry(entry)}
                >
                  <GeodesyPointTitle
                    title={entry.title}
                    picto={entry.titlePicto}
                    className={styles.cartPointTitle}
                  />
                  {entry.subtitle ? <span className={styles.subtitle}>{entry.subtitle}</span> : null}
                  {!entry.pdfUrl ? (
                    <span className={styles.badgeNoPdf}>Sans fiche PDF</span>
                  ) : null}
                </button>
              </div>
              <div className={styles.rowActions}>
                {entry.pdfUrl ? (
                  <a
                    href={entry.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.iconActionButton}
                    aria-label={`Ouvrir la fiche PDF de ${entry.title}`}
                    onClick={trackPointPdfOpen}
                  >
                    <IconPdf className={styles.actionIcon} aria-hidden />
                  </a>
                ) : null}
                <button
                  type="button"
                  className={styles.iconActionButton}
                  onClick={() => remove(entry.key)}
                  aria-label={`Retirer ${entry.title} du panier`}
                >
                  <IconDelete className={styles.actionIcon} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </MapOverlaySheet>
  );
}
