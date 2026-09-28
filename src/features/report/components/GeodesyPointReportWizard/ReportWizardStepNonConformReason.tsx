import type { FunctionComponent, SVGProps } from 'react';

import { joinCSSClassNames } from '@/shared/utils/join';
import IconPhotoNotFound from '@/shared/assets/icons/icon-photo-not-found.svg?react';
import IconPointDammaged from '@/shared/assets/icons/icon-point-dammaged.svg?react';
import IconPointLost from '@/shared/assets/icons/icon-point-lost.svg?react';
import IconPointNotFound from '@/shared/assets/icons/icon-point-not-found.svg?react';
import IconPointWrongPosition from '@/shared/assets/icons/icon-point-wrong-position.svg?react';

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
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
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
      { value: 'photoNonConforme', label: 'Photo non conforme ou absente', Icon: IconPhotoNotFound },
      { value: 'malPositionne', label: 'Mal positionné', Icon: IconPointWrongPosition },
    ],
  },
  {
    title: "Quel est l'état du point ?",
    exclusive: true,
    options: [
      { value: 'mauvaisEtat', label: 'Mauvais état', Icon: IconPointDammaged },
      { value: 'detruit', label: 'Détruit', Icon: IconPointLost },
      { value: 'nonRetrouve', label: 'Non retrouvé', Icon: IconPointNotFound },
    ],
  },
];

export const NON_CONFORM_REASON_LABELS: Record<NonConformReason, string> = Object.fromEntries(
  NON_CONFORM_REASON_GROUPS.flatMap((group) => group.options).map(({ value, label }) => [value, label]),
) as Record<NonConformReason, string>;

export interface ReportWizardStepNonConformReasonProps {
  reasons: NonConformReason[];
  onChange: (reasons: NonConformReason[]) => void;
  /** Un point géodésique est par définition bien positionné : seul un repère de nivellement peut être déplacé. */
  allowPositionReason?: boolean;
}

export function ReportWizardStepNonConformReason({
  reasons,
  onChange,
  allowPositionReason = true,
}: ReportWizardStepNonConformReasonProps) {
  const groups = allowPositionReason
    ? NON_CONFORM_REASON_GROUPS
    : NON_CONFORM_REASON_GROUPS.map((group) => ({
        ...group,
        options: group.options.filter((option) => option.value !== 'malPositionne'),
      }));

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
      {groups.map((group) => (
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
