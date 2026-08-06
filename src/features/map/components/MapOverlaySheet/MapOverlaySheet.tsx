import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import sheetChrome from '@/features/map/styles/mapSheet.module.css';

import styles from './MapOverlaySheet.module.css';

const ANIMATION_DURATION_MS = 300;

export interface MapOverlaySheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleAlign?: 'left' | 'center';
  titleBadge?: number;
  sheetClassName?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  ariaLabel?: string;
}

export function MapOverlaySheet({
  isOpen,
  onClose,
  title,
  titleAlign = 'center',
  titleBadge,
  sheetClassName,
  showBackButton = false,
  onBack,
  children,
  footer,
  ariaLabel,
}: MapOverlaySheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Repart toujours de translateY(110%) pour rejouer le glissé vers le haut.
      setIsVisible(false);
      const timer = window.setTimeout(() => setIsVisible(true), 20);
      return () => window.clearTimeout(timer);
    }

    setIsVisible(false);
    const timer = window.setTimeout(() => setShouldRender(false), ANIMATION_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!shouldRender) {
    return null;
  }

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    onClose();
  };

  const content = (
    <>
      <button
        type="button"
        className={`${styles.backdrop} ${isVisible ? styles.backdropVisible : ''}`}
        onClick={onClose}
        aria-label="Fermer"
      />
      <section
        className={`${sheetChrome.surface} ${styles.sheet} ${sheetClassName ?? ''} ${isVisible ? styles.sheetVisible : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title ?? 'Panneau carte'}
      >
        <div className={sheetChrome.handleArea} aria-hidden>
          <span className={sheetChrome.handle} />
        </div>

        {(title || showBackButton) && (
          <header
            className={`${styles.header} ${titleAlign === 'left' && !showBackButton ? styles.headerTitleLeft : ''}`}
          >
            {showBackButton ? (
              <button type="button" className={styles.backButton} onClick={handleBack}>
                Retour
              </button>
            ) : titleAlign === 'left' ? null : (
              <span className={styles.headerSpacer} />
            )}
            {title ? (
              <h2 className={titleAlign === 'left' ? styles.titleLeft : styles.title}>
                <span>{title}</span>
                {titleBadge !== undefined && titleBadge > 0 ? (
                  <span className={styles.titleBadge}>{titleBadge}</span>
                ) : null}
              </h2>
            ) : (
              <span className={styles.titleSpacer} />
            )}
            <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">
              <IconClose className={styles.closeIcon} aria-hidden />
            </button>
          </header>
        )}

        {!title && !showBackButton ? (
          <div className={styles.closeOnlyHeader}>
            <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">
              <IconClose className={styles.closeIcon} aria-hidden />
            </button>
          </div>
        ) : null}

        <div className={sheetChrome.body} data-scroll-root="true">
          {children}
        </div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </section>
    </>
  );

  return createPortal(content, document.body);
}
