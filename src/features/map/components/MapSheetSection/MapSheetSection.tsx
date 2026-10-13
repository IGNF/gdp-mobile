import type { ReactNode } from 'react';

import styles from './MapSheetSection.module.css';

export interface MapSheetSectionProps {
  title: string;
  children: ReactNode;
}

/** Section titrée d'un panneau carte (filtres, légende, couches), séparée de la suivante par un trait. */
export function MapSheetSection({ title, children }: MapSheetSectionProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.title}>{title}</h3>
      {children}
    </section>
  );
}
