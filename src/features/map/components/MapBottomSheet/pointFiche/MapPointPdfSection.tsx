import IconDownload from '@/shared/assets/icons/icon-download.svg?react';
import IconExternalLink from '@/shared/assets/icons/icon-external-link.svg?react';

import styles from './MapPointSheet.module.css';

export interface MapPointPdfSectionProps {
  pdfUrl: string | null;
}

export function MapPointPdfSection({ pdfUrl }: MapPointPdfSectionProps) {
  if (!pdfUrl) {
    return null;
  }

  return (
    <a
      href={pdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.pdfDownloadLink}
    >
      <span className={styles.pdfDownloadIconSlot}>
        <IconDownload className={styles.pdfDownloadIcon} aria-hidden />
      </span>
      <span className={styles.pdfDownloadTextGroup}>
        <span className={styles.pdfDownloadTitle}>Télécharger la fiche PDF</span>
        <span className={styles.pdfDownloadSubtitle}>
          <IconExternalLink className={styles.pdfDownloadExternalIcon} aria-hidden />
          Document externe, hébergé hors de l'application
        </span>
      </span>
    </a>
  );
}
