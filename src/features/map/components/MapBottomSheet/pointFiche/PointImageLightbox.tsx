import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import IconClose from '@/shared/assets/icons/icon-close.svg?react';

import type { PointCarouselItem } from './pointFicheUtils';
import { useLightboxImageZoom } from './useLightboxImageZoom';

import styles from './PointImageLightbox.module.css';

export interface PointImageLightboxProps {
  items: readonly PointCarouselItem[];
  activeIndex: number;
  onClose: () => void;
  onActiveIndexChange: (index: number) => void;
}

export function PointImageLightbox({
  items,
  activeIndex,
  onClose,
  onActiveIndexChange,
}: PointImageLightboxProps) {
  const item = items[activeIndex];
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < items.length - 1;

  const { viewportRef, transform, viewportHandlers } = useLightboxImageZoom(activeIndex);
  const isZoomed = transform.scale > 1;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (isZoomed) {
        return;
      }

      if (event.key === 'ArrowLeft' && hasPrevious) {
        onActiveIndexChange(activeIndex - 1);
        return;
      }

      if (event.key === 'ArrowRight' && hasNext) {
        onActiveIndexChange(activeIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, hasNext, hasPrevious, isZoomed, onActiveIndexChange, onClose]);

  if (!item) {
    return null;
  }

  return createPortal(
    <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={item.label}>
      <div className={styles.toolbar}>
        <p className={styles.title}>
          {item.caption ?? item.label}
          {items.length > 1 ? (
            <span className={styles.counter}>
              {' '}
              ({activeIndex + 1}/{items.length})
            </span>
          ) : null}
        </p>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">
          <IconClose className={styles.closeIcon} aria-hidden />
        </button>
      </div>

      <div className={styles.imageArea}>
        {hasPrevious && !isZoomed ? (
          <button
            type="button"
            className={`${styles.navButton} ${styles.navButtonPrevious}`}
            onClick={() => onActiveIndexChange(activeIndex - 1)}
            aria-label="Image précédente"
          >
            ‹
          </button>
        ) : null}

        <div
          ref={viewportRef}
          className={styles.viewport}
          {...viewportHandlers}
          aria-label="Image zoomable"
        >
          <img
            src={item.imageUrl}
            alt={item.label}
            className={styles.image}
            draggable={false}
            style={{
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
            }}
          />
        </div>

        {hasNext && !isZoomed ? (
          <button
            type="button"
            className={`${styles.navButton} ${styles.navButtonNext}`}
            onClick={() => onActiveIndexChange(activeIndex + 1)}
            aria-label="Image suivante"
          >
            ›
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
