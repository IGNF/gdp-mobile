import type { PointFieldEntry } from './pointFicheUtils';

import styles from './UnmappedFieldsDebug.module.css';

export interface UnmappedFieldsDebugProps {
  fields: readonly PointFieldEntry[];
}

export function UnmappedFieldsDebug({ fields }: UnmappedFieldsDebugProps) {
  return (
    <section className={styles.debug} aria-label="DEBUG -- Champs non encore affichés">
      <h3 className={styles.title}>DEBUG -- Champs non encore affichés</h3>
      {fields.length === 0 ? (
        <p className={styles.empty}>Tous les champs connus sont couverts par la fiche.</p>
      ) : (
        <ul className={styles.list}>
          {fields.map((field) => (
            <li key={field.id} className={styles.item}>
              <span className={styles.fieldLabel}>{field.label}</span>
              <span className={styles.fieldValue}>{field.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
