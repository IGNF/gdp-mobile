import { useEffect, useRef, useState, type ReactNode } from 'react';

import { joinCSSClassNames } from '@/shared/utils/join';
import IconSlider from '@/shared/assets/icons/slider.svg?react';

import styles from './MyReportsPage.module.css';

export interface ReportFilterRowProps {
  children: ReactNode;
}

/**
 * Rangée de filtres défilant horizontalement. Si les filtres ne tiennent pas dans la largeur,
 * une flèche fixe indique la suite de chaque côté où il en reste (à droite : avancer, à gauche :
 * revenir aux premiers) ; les filtres qui passent dessous s'estompent progressivement.
 */
export function ReportFilterRow({ children }: ReportFilterRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Destination d'un défilement lancé par une flèche : les flèches suivent la destination dès
  // le clic, sans attendre la fin de l'animation. Annulée si l'utilisateur touche la rangée.
  const scrollTargetRef = useRef<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = (element: HTMLDivElement) => {
    const target = scrollTargetRef.current;
    if (target !== null && Math.abs(element.scrollLeft - target) < 1) {
      scrollTargetRef.current = null;
    }

    const left = scrollTargetRef.current ?? element.scrollLeft;
    setCanScrollLeft(left > 1);
    setCanScrollRight(left + element.clientWidth < element.scrollWidth - 1);
  };

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const update = () => updateArrows(element);
    const cancelTarget = () => {
      scrollTargetRef.current = null;
    };

    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    element.addEventListener('pointerdown', cancelTarget, { passive: true });
    return () => {
      resizeObserver.disconnect();
      element.removeEventListener('scroll', update);
      element.removeEventListener('pointerdown', cancelTarget);
    };
  }, []);

  const scrollTo = (left: number) => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const maxLeft = element.scrollWidth - element.clientWidth;
    scrollTargetRef.current = Math.min(Math.max(left, 0), maxLeft);
    updateArrows(element);
    element.scrollTo({ left: scrollTargetRef.current, behavior: 'smooth' });
  };

  const scrollForward = () => {
    const element = scrollRef.current;
    if (element) {
      scrollTo(element.scrollLeft + element.clientWidth * 0.6);
    }
  };

  const scrollToStart = () => scrollTo(0);

  return (
    <div className={styles.filterBar}>
      <div
        ref={scrollRef}
        className={joinCSSClassNames(
          styles.filterRow,
          canScrollLeft && styles.filterRowFadedLeft,
          canScrollRight && styles.filterRowFadedRight,
        )}
      >
        {children}
      </div>
      {canScrollLeft ? (
        <button
          type="button"
          className={joinCSSClassNames(styles.filterSlider, styles.filterSliderLeft)}
          onClick={scrollToStart}
          aria-label="Revenir aux premiers filtres"
        >
          <IconSlider className={styles.filterSliderIcon} aria-hidden />
        </button>
      ) : null}
      {canScrollRight ? (
        <button
          type="button"
          className={joinCSSClassNames(styles.filterSlider, styles.filterSliderRight)}
          onClick={scrollForward}
          aria-label="Voir les autres filtres"
        >
          <IconSlider className={styles.filterSliderIcon} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
