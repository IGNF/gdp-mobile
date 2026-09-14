import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import sheetChrome from '@/features/map/styles/mapSheet.module.css';
import { useBottomSheetSnap } from '@/features/map/hooks/useBottomSheetSnap';

import styles from './MapOverlaySheet.module.css';

const ANIMATION_DURATION_MS = 300;

// Hauteurs de la poignée de redimensionnement (mode `draggable`) : une taille compacte à
// l'ouverture, et une taille étendue alignée sur le plafond CSS de .sheetLarge (min(92vh, 43.5rem)).
function getDraggableSnapHeights(viewportHeight: number): readonly number[] {
  const compactHeight = Math.min(Math.round(viewportHeight * 0.58), 560);
  const expandedHeight = Math.min(Math.round(viewportHeight * 0.92), 696);
  return [compactHeight, expandedHeight];
}

export interface MapOverlaySheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleAlign?: 'left' | 'center';
  titleBadge?: number;
  sheetClassName?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  ariaLabel?: string;
  /** Rend la poignée fonctionnelle : glisser pour agrandir/réduire, glisser sous le seuil pour fermer. */
  draggable?: boolean;
}

export function MapOverlaySheet({
  isOpen,
  onClose,
  title,
  titleAlign = 'center',
  titleBadge,
  sheetClassName,
  children,
  footer,
  ariaLabel,
  draggable = false,
}: MapOverlaySheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);

  useEffect(() => {
    if (!draggable) {
      return;
    }

    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draggable]);

  const snapHeights = useMemo(() => getDraggableSnapHeights(viewportHeight), [viewportHeight]);

  const { setSnapIndex, currentHeight, dragOffset, dragHandleProps } = useBottomSheetSnap({
    snapHeights,
    initialIndex: 0,
    enabled: draggable,
    onDismiss: onClose,
  });

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Repart toujours de translateY(110%) pour rejouer le glissé vers le haut.
      setIsVisible(false);
      if (draggable) {
        setSnapIndex(0);
      }
      const timer = window.setTimeout(() => setIsVisible(true), 20);
      return () => window.clearTimeout(timer);
    }

    setIsVisible(false);
    const timer = window.setTimeout(() => setShouldRender(false), ANIMATION_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen, draggable, setSnapIndex]);

  if (!shouldRender) {
    return null;
  }

  const isDragging = draggable && dragOffset !== 0;

  const content = (
    <>
      <button
        type="button"
        className={`${styles.backdrop} ${isVisible ? styles.backdropVisible : ''}`}
        onClick={onClose}
        aria-label="Fermer"
      />
      <section
        className={[
          sheetChrome.surface,
          styles.sheet,
          sheetClassName ?? '',
          isVisible ? styles.sheetVisible : '',
          isDragging ? styles.sheetDragging : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={draggable ? { height: `${currentHeight}px` } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title ?? 'Panneau carte'}
      >
        <div
          className={`${sheetChrome.handleArea} ${draggable ? styles.handleAreaDraggable : ''}`}
          {...(draggable ? dragHandleProps : {})}
          aria-hidden={!draggable}
        >
          <span className={sheetChrome.handle} />
        </div>

        {(title ) && (
          <header
            className={`${styles.header} ${titleAlign === 'left' }`}
          >
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
          </header>
        )}

        <div className={sheetChrome.body} data-scroll-root="true">
          {children}
        </div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </section>
    </>
  );

  return createPortal(content, document.body);
}
