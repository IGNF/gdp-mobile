import { joinCSSClassNames } from '@/shared/utils/join';
import IconCamera from '@/shared/assets/icons/icon-camera.svg?react';
import IconAlertCircle from '@/shared/assets/icons/icon-alert-circle.svg?react';
import IconDelete from '@/shared/assets/icons/icon-delete.svg?react';
import IconSearch from '@/shared/assets/icons/icon-search.svg?react';
import IconLocation from '@/shared/assets/icons/icon-location.svg?react';

import styles from './ReportWizardStepNonConformReason.module.css';

export type NonConformReason =
  | 'photoNonConforme'
  | 'mauvaisEtat'
  | 'detruit'
  | 'nonRetrouve'
  | 'malPositionne';

const NON_CONFORM_REASONS: Array<{
  value: NonConformReason;
  label: string;
  description: string;
  Icon: typeof IconCamera;
}> = [
  { value: 'photoNonConforme', label: 'Photo non conforme', description: 'Lorem ipsum dolor sit amet', Icon: IconCamera },
  { value: 'mauvaisEtat', label: 'Mauvais état', description: 'Lorem ipsum dolor sit amet', Icon: IconAlertCircle },
  { value: 'detruit', label: 'Détruit', description: 'Lorem ipsum dolor sit amet', Icon: IconDelete },
  { value: 'nonRetrouve', label: 'Non retrouvé', description: 'Lorem ipsum dolor sit amet', Icon: IconSearch },
  { value: 'malPositionne', label: 'Mal positionné', description: 'Lorem ipsum dolor sit amet', Icon: IconLocation },
];

export interface ReportWizardStepNonConformReasonProps {
  reason: NonConformReason | null;
  onChange: (reason: NonConformReason) => void;
}

export function ReportWizardStepNonConformReason({
  reason,
  onChange,
}: ReportWizardStepNonConformReasonProps) {
  return (
    <div className={styles.step}>
      <h2 className={styles.question}>Quel est l&apos;état du point ?</h2>
      <p className={styles.subtitle}>Sélectionnez l&apos;état constaté sur le terrain</p>

      <div className={styles.options} role="radiogroup" aria-label="Motif de non-conformité">
        {NON_CONFORM_REASONS.map(({ value, label, description, Icon }) => {
          const isSelected = reason === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={joinCSSClassNames(styles.card, isSelected && styles.cardSelected)}
              onClick={() => onChange(value)}
            >
              <span className={styles.stateIcon}>
                <Icon className={styles.stateIconSvg} aria-hidden />
              </span>
              <span className={styles.cardText}>
                <span className={styles.cardLabel}>{label}</span>
                <span className={styles.cardDescription}>{description}</span>
              </span>
              <span
                className={joinCSSClassNames(styles.radio, isSelected && styles.radioChecked)}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
