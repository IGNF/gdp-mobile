import { useState } from 'react';

import { joinCSSClassNames } from '@/shared/utils/join';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';

import styles from './ReportWizardStepConformity.module.css';

const CONFORMITY_CRITERIA = [
  'Le point est au bon endroit',
  'La photo correspond à la réalité',
  'Le point est en bon état',
];

const NON_CONFORMITY_CRITERIA = [
  "Le point n'est pas retrouvé",
  "La photo ne correspond pas ou plus à l'environnement",
  "Le point n'a pas de photo",
  'Le point est déplacé ou détérioré',
  "Le point n'est pas placé au bon endroit",
];

export interface ReportWizardStepConformityProps {
  isConform: boolean | null;
  onChange: (isConform: boolean) => void;
}

export function ReportWizardStepConformity({ isConform, onChange }: ReportWizardStepConformityProps) {
  const [hoveredCard, setHoveredCard] = useState<'conform' | 'nonConform' | null>(null);

  const isConformExpanded = isConform === true || hoveredCard === 'conform';
  const isNonConformExpanded = isConform === false || hoveredCard === 'nonConform';

  return (
    <div className={styles.step}>
      <h2 className={styles.question}>Quel est l&apos;état du point ?</h2>
      <p className={styles.subtitle}>Sélectionnez l&apos;état constaté sur le terrain</p>

      <div className={styles.options} role="radiogroup" aria-label="État du point">
        <button
          type="button"
          role="radio"
          aria-checked={isConform === true}
          className={joinCSSClassNames(
            styles.card,
            styles.cardConform,
            isConform === true && styles.cardSelectedConform,
          )}
          onClick={() => onChange(true)}
          onMouseEnter={() => setHoveredCard('conform')}
          onMouseLeave={() => setHoveredCard((current) => (current === 'conform' ? null : current))}
          onFocus={() => setHoveredCard('conform')}
          onBlur={() => setHoveredCard((current) => (current === 'conform' ? null : current))}
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
              className={joinCSSClassNames(styles.radio, styles.radioConform, isConform === true && styles.radioChecked)}
              aria-hidden
            />
          </div>

          <div
            className={joinCSSClassNames(styles.criteriaWrapper, isConformExpanded && styles.criteriaWrapperExpanded)}
          >
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
          </div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={isConform === false}
          className={joinCSSClassNames(
            styles.card,
            styles.cardNonConform,
            isConform === false && styles.cardSelectedNonConform,
          )}
          onClick={() => onChange(false)}
          onMouseEnter={() => setHoveredCard('nonConform')}
          onMouseLeave={() => setHoveredCard((current) => (current === 'nonConform' ? null : current))}
          onFocus={() => setHoveredCard('nonConform')}
          onBlur={() => setHoveredCard((current) => (current === 'nonConform' ? null : current))}
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
                isConform === false && styles.radioChecked,
              )}
              aria-hidden
            />
          </div>

          <div
            className={joinCSSClassNames(
              styles.criteriaWrapper,
              isNonConformExpanded && styles.criteriaWrapperExpanded,
            )}
          >
            <div className={styles.criteria}>
              <p className={styles.criteriaTitle}>Motifs de non-conformité</p>
              <ul className={styles.criteriaList}>
                {NON_CONFORMITY_CRITERIA.map((criterion, index) => (
                  <li key={index} className={styles.criteriaItem}>
                    <IconClose className={joinCSSClassNames(styles.criteriaIcon, styles.criteriaIconNonConform)} aria-hidden />
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
