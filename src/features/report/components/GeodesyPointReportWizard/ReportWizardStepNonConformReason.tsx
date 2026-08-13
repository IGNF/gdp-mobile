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

interface NonConformReasonOption {
  value: NonConformReason;
  label: string;
  Icon: typeof IconCamera;
}

interface NonConformReasonGroup {
  title: string;
  exclusive: boolean;
  options: NonConformReasonOption[];
}

const NON_CONFORM_REASON_GROUPS: NonConformReasonGroup[] = [
  {
    title: 'Des informations sur le point sont-elles incorrectes ?',
    exclusive: false,
    options: [
      { value: 'photoNonConforme', label: 'Photo non conforme ou absente', Icon: IconCamera },
      { value: 'malPositionne', label: 'Mal positionné', Icon: IconLocation },
    ],
  },
  {
    title: "Quel est l'état du point ?",
    exclusive: true,
    options: [
      { value: 'mauvaisEtat', label: 'Mauvais état', Icon: IconAlertCircle },
      { value: 'detruit', label: 'Détruit', Icon: IconDelete },
      { value: 'nonRetrouve', label: 'Non retrouvé', Icon: IconSearch },
    ],
  },
];

export const NON_CONFORM_REASON_LABELS: Record<NonConformReason, string> = Object.fromEntries(
  NON_CONFORM_REASON_GROUPS.flatMap((group) => group.options).map(({ value, label }) => [value, label]),
) as Record<NonConformReason, string>;

export interface ReportWizardStepNonConformReasonProps {
  reasons: NonConformReason[];
  onChange: (reasons: NonConformReason[]) => void;
}

export function ReportWizardStepNonConformReason({
  reasons,
  onChange,
}: ReportWizardStepNonConformReasonProps) {
  const toggleReason = (group: NonConformReasonGroup, value: NonConformReason) => {
    const isSelected = reasons.includes(value);

    if (!group.exclusive) {
      onChange(isSelected ? reasons.filter((reason) => reason !== value) : [...reasons, value]);
      return;
    }

    const groupValues = group.options.map((option) => option.value);
    const withoutGroup = reasons.filter((reason) => !groupValues.includes(reason));
    onChange(isSelected ? withoutGroup : [...withoutGroup, value]);
  };

  return (
    <div className={styles.step}>
      {NON_CONFORM_REASON_GROUPS.map((group) => (
        <div key={group.title} className={styles.group}>
          <p className={styles.groupTitle}>{group.title}</p>
          <div
            className={styles.options}
            role={group.exclusive ? 'radiogroup' : 'group'}
            aria-label={group.title}
          >
            {group.options.map(({ value, label, Icon }) => {
              const isSelected = reasons.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  role={group.exclusive ? 'radio' : 'checkbox'}
                  aria-checked={isSelected}
                  className={joinCSSClassNames(styles.card, isSelected && styles.cardSelected)}
                  onClick={() => toggleReason(group, value)}
                >
                  <span className={styles.stateIcon}>
                    <Icon className={styles.stateIconSvg} aria-hidden />
                  </span>
                  <span className={styles.cardLabel}>{label}</span>
                  <span
                    className={joinCSSClassNames(
                      group.exclusive ? styles.radio : styles.checkbox,
                      isSelected && (group.exclusive ? styles.radioChecked : styles.checkboxChecked),
                    )}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
