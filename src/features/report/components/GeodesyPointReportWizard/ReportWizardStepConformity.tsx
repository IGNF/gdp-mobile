import { joinCSSClassNames } from '@/shared/utils/join';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';

import styles from './ReportWizardStepConformity.module.css';

const CONFORMITY_CRITERIA = [
  'Lorem ipsum dolor sit amet',
  'Lorem ipsum dolor sit amet',
  'Lorem ipsum dolor sit amet',
  'Lorem ipsum dolor sit amet',
];

export interface ReportWizardStepConformityProps {
  isConform: boolean;
  onChange: (isConform: boolean) => void;
}

export function ReportWizardStepConformity({ isConform, onChange }: ReportWizardStepConformityProps) {
  return (
    <div className={styles.step}>
      <h2 className={styles.question}>Quel est l&apos;état du point ?</h2>
      <p className={styles.subtitle}>Sélectionnez l&apos;état constaté sur le terrain</p>

      <div className={styles.options} role="radiogroup" aria-label="État du point">
        <button
          type="button"
          role="radio"
          aria-checked={isConform}
          className={joinCSSClassNames(
            styles.card,
            styles.cardConform,
            isConform && styles.cardSelectedConform,
          )}
          onClick={() => onChange(true)}
        >
          <div className={styles.cardRow}>
            <span className={joinCSSClassNames(styles.stateIcon, styles.stateIconConform)}>
              <IconCheck className={styles.stateIconSvg} aria-hidden />
            </span>
            <span className={styles.cardText}>
              <span className={joinCSSClassNames(styles.cardLabel, styles.cardLabelConform)}>
                Conforme
              </span>
              <span className={styles.cardDescription}>Lorem ipsum dolor sit amet</span>
            </span>
            <span
              className={joinCSSClassNames(styles.radio, styles.radioConform, isConform && styles.radioChecked)}
              aria-hidden
            />
          </div>

          {isConform ? (
            <div className={styles.criteria}>
              <p className={styles.criteriaTitle}>Critères de conformité</p>
              <ul className={styles.criteriaList}>
                {CONFORMITY_CRITERIA.map((criterion, index) => (
                  <li key={index} className={styles.criteriaItem}>
                    <IconCheck className={styles.criteriaIcon} aria-hidden />
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={!isConform}
          className={joinCSSClassNames(
            styles.card,
            styles.cardNonConform,
            !isConform && styles.cardSelectedNonConform,
          )}
          onClick={() => onChange(false)}
        >
          <div className={styles.cardRow}>
            <span className={joinCSSClassNames(styles.stateIcon, styles.stateIconNonConform)}>
              <IconClose className={styles.stateIconSvg} aria-hidden />
            </span>
            <span className={styles.cardText}>
              <span className={joinCSSClassNames(styles.cardLabel, styles.cardLabelNonConform)}>
                Non Conforme
              </span>
              <span className={styles.cardDescription}>Lorem ipsum dolor sit amet</span>
            </span>
            <span
              className={joinCSSClassNames(
                styles.radio,
                styles.radioNonConform,
                !isConform && styles.radioChecked,
              )}
              aria-hidden
            />
          </div>
        </button>
      </div>
    </div>
  );
}
