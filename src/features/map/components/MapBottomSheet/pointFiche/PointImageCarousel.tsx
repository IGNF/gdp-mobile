import { useCallback, useRef, useState } from 'react';

import IconFullscreen from '@/shared/assets/icons/icon-fullscreen.svg?react';

import type { PointCarouselItem } from './pointFicheUtils';
import { PointImageLightbox } from './PointImageLightbox';

import styles from './PointImageCarousel.module.css';

export interface PointImageCarouselProps {
  items: readonly PointCarouselItem[];
}

export function PointImageCarousel({ items }: PointImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) {
      return;
    }

    const slideWidth = track.clientWidth;
    if (slideWidth <= 0) {
      return;
    }

    const nextIndex = Math.round(track.scrollLeft / slideWidth);
    setActiveIndex(Math.max(0, Math.min(nextIndex, items.length - 1)));
  }, [items.length]);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const handleLightboxIndexChange = useCallback((index: number) => {
    setLightboxIndex(index);
    setActiveIndex(index);

    const track = trackRef.current;
    if (!track) {
      return;
    }

    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
  }, []);

  if (items.length === 0) {
    return (
      <div className={styles.empty} aria-hidden>
        Aucune photo ou croquis disponible.
      </div>
    );
  }

  return (
    <>
      <div className={styles.carousel}>
        <div
          ref={trackRef}
          className={styles.track}
          onScroll={handleScroll}
          aria-roledescription="carrousel"
          aria-label="Photos et croquis du repère"
        >
          {items.map((item, index) => (
            <figure
              key={item.id}
              className={styles.slide}
              aria-roledescription="slide"
              aria-label={`${index + 1} sur ${items.length}`}
            >
              <div className={styles.imageWrap}>
                <img src={item.imageUrl} alt={item.label} className={styles.image} loading="lazy" />
                <button
                  type="button"
                  className={styles.expandButton}
                  onClick={() => openLightbox(index)}
                  aria-label={`Afficher ${item.label} en grand`}
                >
                  <IconFullscreen className={styles.expandIcon} aria-hidden />
                </button>
              </div>
              {/* {item.caption ? <figcaption className={styles.caption}>{item.caption}</figcaption> : null} */}
            </figure>
          ))}
        </div>

        {items.length > 1 ? (
          <div className={styles.dots} aria-hidden>
            {items.map((item, index) => (
              <span
                key={item.id}
                className={index === activeIndex ? styles.dotActive : styles.dot}
              />
            ))}
          </div>
        ) : null}
      </div>

      {lightboxIndex !== null ? (
        <PointImageLightbox
          items={items}
          activeIndex={lightboxIndex}
          onClose={closeLightbox}
          onActiveIndexChange={handleLightboxIndexChange}
        />
      ) : null}
    </>
  );
}
