import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import sheetChrome from '@/features/map/styles/mapSheet.module.css';
import { useBottomSheetSnap } from '@/features/map/hooks/useBottomSheetSnap';

import styles from './MapOverlaySheet.module.css';

const ANIMATION_DURATION_MS = 300;

const DEFAULT_COMPACT_HEIGHT_RATIO = 0.58;

// Doivent rester alignés sur le plafond CSS de .sheetLarge : min(92vh, 43.5rem).
const LARGE_SHEET_MAX_VIEWPORT_RATIO = 0.92;
const LARGE_SHEET_MAX_HEIGHT_PX = 696;

// Hauteurs de la poignée de redimensionnement (mode `draggable`) : une taille compacte à
// l'ouverture (part de `compactHeightRatio` de l'écran, 58% par défaut), et une taille étendue
// égale au plafond de .sheetLarge, éventuellement réduite par `maxExpandedHeightPx`
// (ex. pour ne pas dépasser un repère à l'écran).
function getDraggableSnapHeights(
  viewportHeight: number,
  compactHeightRatio: number,
  maxExpandedHeightPx?: number,
): readonly number[] {
  const compactHeight = Math.min(Math.round(viewportHeight * compactHeightRatio), 560);
  const uncappedExpandedHeight = Math.min(
    Math.round(viewportHeight * LARGE_SHEET_MAX_VIEWPORT_RATIO),
    LARGE_SHEET_MAX_HEIGHT_PX,
  );
  const expandedHeight =
    maxExpandedHeightPx !== undefined
      ? Math.min(uncappedExpandedHeight, Math.round(maxExpandedHeightPx))
      : uncappedExpandedHeight;

  return [Math.min(compactHeight, expandedHeight), expandedHeight];
}

export interface MapOverlaySheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleBadge?: number;
  /** `large` : plafond min(92vh, 43.5rem), à utiliser avec `draggable`. */
  size?: 'compact' | 'large';
  sheetClassName?: string;
  children: ReactNode;
  footer?: ReactNode;
  ariaLabel?: string;
  /** Rend la poignée fonctionnelle : glisser pour agrandir/réduire, glisser sous le seuil pour fermer. */
  draggable?: boolean;
  /** Plafonne la hauteur dépliée (mode `draggable`), ex. pour ne pas couvrir un repère à l'écran. */
  maxExpandedHeightPx?: number;
  /** Part de la hauteur d'écran occupée à l'ouverture (mode `draggable`), défaut 0.58. */
  compactHeightRatio?: number;
  /**
   * Ne pas capturer les interactions dans la zone carte au-dessus du panneau (zoom, pan).
   * Le panneau se ferme via le FAB, la poignée ou un bouton dédié — pas par tap sur la carte.
   */
  allowMapInteraction?: boolean;
}

export function MapOverlaySheet({
  isOpen,
  onClose,
  title,
  titleBadge,
  size = 'compact',
  sheetClassName,
  children,
  footer,
  ariaLabel,
  draggable = false,
  maxExpandedHeightPx,
  compactHeightRatio = DEFAULT_COMPACT_HEIGHT_RATIO,
  allowMapInteraction = false,
}: MapOverlaySheetProps) {
  const [holdInDom, setHoldInDom] = useState(isOpen);
  const [isSheetShown, setIsSheetShown] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);

  const showPortal = isOpen || holdInDom;

  useEffect(() => {
    if (!draggable) {
      return;
    }

    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draggable]);

  const snapHeights = useMemo(
    () => getDraggableSnapHeights(viewportHeight, compactHeightRatio, maxExpandedHeightPx),
    [viewportHeight, compactHeightRatio, maxExpandedHeightPx],
  );

  const { setSnapIndex, currentHeight, dragOffset, dragHandleProps } = useBottomSheetSnap({
    snapHeights,
    initialIndex: 0,
    enabled: draggable,
    onDismiss: onClose,
  });

  // Transition isOpen : resynchronisation pendant le rendu (le démontage différé reste dans un effet).
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setHoldInDom(true);
      setIsSheetShown(false);
      if (draggable) {
        setSnapIndex(0);
      }
    } else {
      setIsSheetShown(false);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let outerFrame = 0;
    let innerFrame = 0;
    outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => setIsSheetShown(true));
    });

    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen || !holdInDom) {
      return;
    }

    const timer = window.setTimeout(() => setHoldInDom(false), ANIMATION_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [holdInDom, isOpen]);

  if (!showPortal) {
    return null;
  }

  const isDragging = draggable && dragOffset !== 0;

  const content = (
    <>
      {allowMapInteraction ? null : (
        <button
          type="button"
          className={`${styles.backdrop} ${isSheetShown ? styles.backdropVisible : ''}`}
          onClick={onClose}
          aria-label="Fermer"
        />
      )}
      <section
        className={[
          sheetChrome.surface,
          styles.sheet,
          size === 'large' ? styles.sheetLarge : '',
          sheetClassName ?? '',
          isSheetShown ? styles.sheetVisible : '',
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

        {title ? (
          <header className={styles.header}>
            <h2 className={styles.title}>
              <span>{title}</span>
              {titleBadge !== undefined && titleBadge > 0 ? (
                <span className={styles.titleBadge}>{titleBadge}</span>
              ) : null}
            </h2>
          </header>
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