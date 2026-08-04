import { useState } from 'react';

import { ReportPositionEditorSection } from '@/features/report/components/ReportPositionEditorSection';
import type { UseGeodesyPointReportFormReturn } from '@/features/report/hooks/useGeodesyPointReportForm';
import { NON_CONFORM_REASON_LABELS, type NonConformReason } from '@/features/report/components/GeodesyPointReportWizard/ReportWizardStepNonConformReason';
import { joinCSSClassNames } from '@/shared/utils/join';
import IconArticle from '@/shared/assets/icons/icon-article.svg?react';
import IconCamera from '@/shared/assets/icons/icon-camera.svg?react';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconLocation from '@/shared/assets/icons/icon-location.svg?react';
import IconPencil from '@/shared/assets/icons/icon-pencil.svg?react';

import styles from './ReportWizardStepSummary.module.css';

export interface ReportWizardStepSummaryProps {
  isConform: boolean;
  nonConformReason: NonConformReason | null;
  mediaStep: number;
  form: UseGeodesyPointReportFormReturn;
  onEditStep: (step: number) => void;
}

export function ReportWizardStepSummary({
  isConform,
  nonConformReason,
  mediaStep,
  form,
  onEditStep,
}: ReportWizardStepSummaryProps) {
  const [isPositionEditorOpen, setIsPositionEditorOpen] = useState(false);
  const stateLabel = isConform ? 'Conforme' : 'Non conforme';
  const stateDetail = isConform
    ? stateLabel
    : nonConformReason
      ? NON_CONFORM_REASON_LABELS[nonConformReason]
      : '—';
  const positionLabel = form.canResetPosition ? 'Modifiée' : 'Confirmée';
  const coordinateLabel =
    form.latitude !== null ? `${form.latitude.toFixed(4)}° N` : '—';

  return (
    <div className={styles.step}>
      <h2 className={styles.title}>Récapitulatif</h2>
      <p className={styles.subtitle}>Vérifiez les informations avant d&apos;envoyer</p>

      <div className={styles.photoCard}>
        {form.photo1 ? (
          <img src={form.photo1.previewUrl} alt="" className={styles.photoImage} />
        ) : (
          <div className={styles.photoPlaceholder}>
            <IconCamera className={styles.photoPlaceholderIcon} aria-hidden />
          </div>
        )}
        <button
          type="button"
          className={styles.editButton}
          onClick={() => onEditStep(mediaStep)}
          aria-label="Modifier la photo"
        >
          <IconPencil className={styles.editIcon} aria-hidden />
        </button>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <button
            type="button"
            className={styles.cardEditButton}
            onClick={() => onEditStep(0)}
            aria-label="Modifier l'état du point"
          >
            <IconPencil className={styles.cardEditIcon} aria-hidden />
          </button>
          <span
            className={joinCSSClassNames(
              styles.cardIcon,
              isConform ? styles.cardIconConform : styles.cardIconNonConform,
            )}
          >
            {isConform ? (
              <IconCheck className={styles.cardIconSvg} aria-hidden />
            ) : (
              <IconClose className={styles.cardIconSvg} aria-hidden />
            )}
          </span>
          <p className={styles.cardLabel}>État</p>
          <p className={styles.cardValue}>{stateLabel}</p>
          <p className={styles.cardDetail}>{stateDetail}</p>
        </div>

        <div className={styles.card}>
          {form.canEditPosition ? (
            <button
              type="button"
              className={styles.cardEditButton}
              onClick={() => setIsPositionEditorOpen((current) => !current)}
              aria-label="Modifier la position"
            >
              <IconPencil className={styles.cardEditIcon} aria-hidden />
            </button>
          ) : null}
          <span className={joinCSSClassNames(styles.cardIcon, styles.cardIconConform)}>
            <IconLocation className={styles.cardIconSvg} aria-hidden />
          </span>
          <p className={styles.cardLabel}>Position</p>
          <p className={styles.cardValue}>{positionLabel}</p>
          <p className={styles.cardDetail}>{coordinateLabel}</p>
        </div>
      </div>

      <ReportPositionEditorSection
        form={form}
        isOpen={isPositionEditorOpen}
        onToggle={() => setIsPositionEditorOpen((current) => !current)}
      />

      <div className={styles.commentCard}>
        <div className={styles.commentHeader}>
          <span className={styles.commentTitle}>
            <IconArticle className={styles.commentIcon} aria-hidden />
            Commentaire
          </span>
          <button
            type="button"
            className={styles.commentEditButton}
            onClick={() => onEditStep(mediaStep)}
          >
            <IconPencil className={styles.commentEditIcon} aria-hidden />
            modifier
          </button>
        </div>
        <p className={styles.commentBody}>
          {form.comment.trim() ? form.comment : 'Aucun commentaire ajouté.'}
        </p>
      </div>
    </div>
  );
}
