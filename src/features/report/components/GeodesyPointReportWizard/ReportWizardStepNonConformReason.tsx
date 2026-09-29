import { joinCSSClassNames } from '@/shared/utils/join';

import { NON_CONFORM_REASON_GROUPS, type NonConformReason, type NonConformReasonGroup } from './nonConformReasons';
import styles from './ReportWizardStepNonConformReason.module.css';

export type { NonConformReason };

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
