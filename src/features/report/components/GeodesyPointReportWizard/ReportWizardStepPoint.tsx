import type { GeodesyPointReportContext } from '@ign/gdp-tools';
import { useState } from 'react';

import { BoundaryReportThemeField } from '@/features/report/components/BoundaryReportThemeField';
import type { UseGeodesyPointReportFormReturn } from '@/features/report/hooks/useGeodesyPointReportForm';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';

import boundaryFormStyles from '@/features/report/components/BoundaryReportForm/BoundaryReportForm.module.css';
import styles from './ReportWizardStepPoint.module.css';

export interface ReportWizardStepPointProps {
  reportContext: GeodesyPointReportContext;
  form: UseGeodesyPointReportFormReturn;
}

type PointState = 'conforme' | 'non-conforme';

const STATE_CHOICES: {
  value: PointState;
  label: string;
  description: string;
  Icon: typeof IconCheck;
}[] = [
  {
    value: 'conforme',
    label: 'Conforme',
    description: 'Lorem ipsum dolor sit amet',
    Icon: IconCheck,
  },
  {
    value: 'non-conforme',
    label: 'Non Conforme',
    description: 'Lorem ipsum dolor sit amet',
    Icon: IconClose,
  },
];

export function ReportWizardStepPoint({ reportContext, form }: ReportWizardStepPointProps) {
  const [selectedState, setSelectedState] = useState<PointState | null>(null);

  return (
    <div className={styles.step}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Quel est l’état du point ?</h1>
        <p className={styles.subtitle}>Sélectionnez l’état constaté sur le terrain</p>
      </div>

      <div className={styles.choices}>
        {STATE_CHOICES.map(({ value, label, description, Icon }) => {
          const isSelected = selectedState === value;
          const isNegative = value === 'non-conforme';

          return (
            <button
              type="button"
              key={value}
              className={`${styles.choiceCard} ${isSelected ? styles.choiceCardSelected : ''}`}
              onClick={() => setSelectedState(value)}
              aria-pressed={isSelected}
            >
              <span
                className={`${styles.choiceIcon} ${isNegative ? styles.choiceIconNegative : styles.choiceIconPositive}`}
              >
                <Icon aria-hidden />
              </span>
              <span className={styles.choiceText}>
                <span
                  className={`${styles.choiceLabel} ${isNegative ? styles.choiceLabelNegative : styles.choiceLabelPositive}`}
                >
                  {label}
                </span>
                <span className={styles.choiceDescription}>{description}</span>
              </span>
              <span className={`${styles.choiceRadio} ${isSelected ? styles.choiceRadioSelected : ''}`} aria-hidden />
            </button>
          );
        })}
      </div>

      {form.themeFieldDefinitions.length > 0 ? (
        <section className={boundaryFormStyles.section}>
          <h2 className={boundaryFormStyles.sectionLabel}>{reportContext.title}</h2>
          <div className={boundaryFormStyles.fieldGroup}>
            {form.themeFieldDefinitions.map((attribute) => (
              <BoundaryReportThemeField
                key={attribute.name}
                attribute={attribute}
                value={form.themeAttributes[attribute.name] ?? ''}
                error={form.errors.themeAttributes?.[attribute.name]}
                onChange={(value) => form.setThemeAttribute(attribute.name, value)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
