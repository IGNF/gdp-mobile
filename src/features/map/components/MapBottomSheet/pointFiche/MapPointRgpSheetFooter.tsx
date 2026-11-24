import { forwardRef, type PointerEvent } from 'react';
import { RiCornerUpRightLine, RiExternalLinkLine } from 'react-icons/ri';

import { trackRgpStationFicheOpen } from '@/infra/analytics/matomo';
import { Button } from '@/shared/ui/Button';

import styles from './MapPointSheet.module.css';

export interface MapPointRgpSheetFooterProps {
  ficheUrl: string | null;
  onNavigate: () => void;
}

export const MapPointRgpSheetFooter = forwardRef<HTMLElement, MapPointRgpSheetFooterProps>(
  function MapPointRgpSheetFooter({ ficheUrl, onNavigate }, forwardedRef) {
    const stopDrag = (event: PointerEvent<HTMLElement>) => {
      event.stopPropagation();
    };

    const handleOpenFiche = () => {
      if (!ficheUrl) {
        return;
      }

      trackRgpStationFicheOpen();
      window.open(ficheUrl, '_blank', 'noopener,noreferrer');
    };

    return (
      <footer ref={forwardedRef} className={styles.footer}>
        <Button
          type="button"
          variant="outline"
          fullWidth
          className={styles.footerButton}
          onClick={onNavigate}
          onPointerDown={stopDrag}
        >
          <RiCornerUpRightLine className={styles.footerButtonIcon} aria-hidden />
          S&apos;y rendre
        </Button>

        <Button
          type="button"
          fullWidth
          className={styles.footerButton}
          onClick={handleOpenFiche}
          onPointerDown={stopDrag}
          disabled={!ficheUrl}
        >
          <RiExternalLinkLine className={styles.footerButtonIcon} aria-hidden />
          Voir la fiche
        </Button>
      </footer>
    );
  },
);