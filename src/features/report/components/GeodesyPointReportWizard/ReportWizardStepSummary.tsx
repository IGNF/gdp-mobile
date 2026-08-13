import { useState } from 'react';

import { ReportPositionEditorSection } from '@/features/report/components/ReportPositionEditorSection';
import type { UseGeodesyPointReportFormReturn } from '@/features/report/hooks/useGeodesyPointReportForm';
import { NON_CONFORM_REASON_LABELS, type NonConformReason } from '@/features/report/components/GeodesyPointReportWizard/ReportWizardStepNonConformReason';
import { joinCSSClassNames } from '@/shared/utils/join';
import IconArticle from '@/shared/assets/icons/icon-article.svg?react';
import IconCamera from '@/shared/assets/icons/icon-camera.svg?react';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconPencil from '@/shared/assets/icons/icon-pencil.svg?react';

import styles from './ReportWizardStepSummary.module.css';

export interface ReportWizardStepSummaryProps {
  isConform: boolean;
  nonConformReasons: NonConformReason[];
  mediaStep: number;
  form: UseGeodesyPointReportFormReturn;
  onEditStep: (step: number) => void;
}

export function ReportWizardStepSummary({
  isConform,
  nonConformReasons,
  mediaStep,
  form,
  onEditStep,
}: ReportWizardStepSummaryProps) {
  const [isPositionEditorOpen, setIsPositionEditorOpen] = useState(false);
  const stateLabel = isConform ? 'Conforme' : 'Non conforme';
  const stateDetail = isConform
    ? stateLabel
    : nonConformReasons.length > 0
      ? nonConformReasons.map((reason) => NON_CONFORM_REASON_LABELS[reason]).join(', ')
      : '—';
  const positionLabel = form.canResetPosition ? 'Modifiée' : 'Confirmée';
  const coordinateLabel =
    form.latitude !== null && form.longitude !== null
      ? `${form.latitude.toFixed(4)}° N, ${form.longitude.toFixed(4)}° E`
      : '—';

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
          <p className={styles.cardLabel}>État</p>
          <p className={styles.cardValue}>
            <span
              className={joinCSSClassNames(
                styles.cardValueIcon,
                isConform ? styles.cardValueIconConform : styles.cardValueIconNonConform,
              )}
            >
              {isConform ? (
                <IconCheck className={styles.cardValueIconSvg} aria-hidden />
              ) : (
                <IconClose className={styles.cardValueIconSvg} aria-hidden />
              )}
            </span>
            {stateLabel}
          </p>
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
          <p className={styles.cardLabel}>Position</p>
          <p className={styles.cardValue}>
            <span className={joinCSSClassNames(styles.cardValueIcon, styles.cardValueIconConform)}>
              {form.canResetPosition ? (
                <IconPencil className={styles.cardValueIconSvg} aria-hidden />
              ) : (
                <IconCheck className={styles.cardValueIconSvg} aria-hidden />
              )}
            </span>
            {positionLabel}
          </p>
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
