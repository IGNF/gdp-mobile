import { useState } from 'react';

import { joinCSSClassNames } from '@/shared/utils/join';
import IconAngleDown from '@/shared/assets/icons/icon-angle-down.svg?react';

import type { PointFieldEntry } from './pointFicheUtils';

import styles from './UnmappedFieldsDebug.module.css';

export interface UnmappedFieldsDebugProps {
  fields: readonly PointFieldEntry[];
}

export function UnmappedFieldsDebug({ fields }: UnmappedFieldsDebugProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section
      className={joinCSSClassNames(styles.debug, isExpanded && styles.debugExpanded)}
      aria-label="DEBUG -- Champs non encore affichés"
    >
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setIsExpanded((value) => !value)}
        aria-expanded={isExpanded}
      >
        <IconAngleDown
          className={joinCSSClassNames(styles.toggleIcon, isExpanded && styles.toggleIconOpen)}
          aria-hidden
        />
      </button>

      {isExpanded ? (
        <>
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
        </>
      ) : null}
    </section>
  );
}
