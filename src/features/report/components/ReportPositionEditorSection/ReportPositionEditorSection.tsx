import { ReportPositionMap } from '@/features/report/components/ReportPositionMap';
import type { UseGeodesyPointReportFormReturn } from '@/features/report/hooks/useGeodesyPointReportForm';
import { Button } from '@/shared/ui/Button';
import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';
import IconLocation from '@/shared/assets/icons/icon-location.svg?react';

import styles from './ReportPositionEditorSection.module.css';

export interface ReportPositionEditorSectionProps {
  form: UseGeodesyPointReportFormReturn;
  isOpen: boolean;
  onToggle: () => void;
}

export function ReportPositionEditorSection({ form, isOpen, onToggle }: ReportPositionEditorSectionProps) {
  if (!form.canEditPosition) {
    return null;
  }

  return (
    <div className={styles.positionSection}>
      <button
        type="button"
        className={styles.positionRow}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={styles.positionIconWrap} aria-hidden>
          <IconLocation className={styles.positionIcon} />
        </span>
        <span className={styles.positionLabel}>Modifier la position du point</span>
        <IconAngleRight className={styles.positionChevron} aria-hidden />
      </button>

      {isOpen ? (
        <div className={styles.positionMapWrap}>
          <ReportPositionMap
            longitude={form.longitude}
            latitude={form.latitude}
            initialLongitude={form.initialPosition.longitude}
            initialLatitude={form.initialPosition.latitude}
            canResetPosition={form.canResetPosition}
            onPositionChange={form.setPosition}
            onResetPosition={form.resetPositionToInitial}
          />
          <Button type="button" fullWidth onClick={onToggle}>
            Confirmer la position
          </Button>
        </div>
      ) : null}
    </div>
  );
}
