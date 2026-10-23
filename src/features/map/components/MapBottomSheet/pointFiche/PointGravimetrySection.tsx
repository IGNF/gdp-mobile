import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';

import { readProperty } from './pointFicheUtils';

import styles from './MapPointSheet.module.css';

export interface PointGravimetrySectionProps {
  action: MapGeodesyClickAction;
}

/** Année d'une date WFS « AAAA/MM/JJ » (ex. « 2023/10/11 » → « 2023 »). */
function extractYear(date: string | null): string | null {
  return date?.match(/\d{4}/)?.[0] ?? null;
}

/** Section « Gravimétrie » : valeur de g (mGal) et année de calcul. */
export function PointGravimetrySection({ action }: PointGravimetrySectionProps) {
  const g = readProperty(action, 'g');
  if (!g) {
    return null;
  }

  const calculYear = extractYear(readProperty(action, 'gravi_calcul_date'));

  return (
    <section>
      <h3 className={styles.sectionTitle}>Gravimétrie</h3>
      <div className={styles.fieldGrid}>
        <div className={styles.fieldCard}>
          <span className={styles.fieldLabel}>g(mGal)</span>
          <span className={styles.fieldValue}>{g}</span>
        </div>
        {calculYear ? (
          <div className={styles.fieldCard}>
            <span className={styles.fieldLabel}>Année</span>
            <span className={styles.fieldValue}>{calculYear}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
