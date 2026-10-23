import { useState } from 'react';

import { ReportPositionMap } from '@/features/report/components/ReportPositionMap';
import type { UseGeodesyPointReportFormReturn } from '@/features/report/hooks/useGeodesyPointReportForm';
import { Button } from '@/shared/ui/Button';
import { formatDate } from '@/shared/utils/date';
import { joinCSSClassNames } from '@/shared/utils/join';
import IconCamera from '@/shared/assets/icons/icon-camera.svg?react';
import IconPencil from '@/shared/assets/icons/icon-pencil.svg?react';

import styles from './ReportWizardStepSummary.module.css';

/** Carte du récapitulatif : 2:1, comme la fiche détail (la photo est en 20:9, cf. `.photoCard`). */
const MAP_ASPECT_RATIO = '2 / 1';

export interface ReportWizardStepSummaryProps {
  isConform: boolean;
  mediaStep: number;
  form: UseGeodesyPointReportFormReturn;
  /** Adresse du repère : voie suivie, à défaut sa commune. */
  address: string | null;
  onEditStep: (step: number) => void;
}

interface EditButtonProps {
  label: string;
  className?: string;
  onClick: () => void;
}

function EditButton({ label, className, onClick }: EditButtonProps) {
  return (
    <button
      type="button"
      className={joinCSSClassNames(styles.editButton, className)}
      onClick={onClick}
      aria-label={label}
    >
      <IconPencil className={styles.editIcon} aria-hidden />
    </button>
  );
}

/** Récapitulatif avant envoi — même présentation que la fiche détail d'un signalement (ReportDetailContent). */
export function ReportWizardStepSummary({
  isConform,
  mediaStep,
  form,
  address,
  onEditStep,
}: ReportWizardStepSummaryProps) {
  // Position avant modification, rétablie par « Annuler ».
  const [positionBeforeEdit, setPositionBeforeEdit] = useState<{ longitude: number; latitude: number } | null>(
    null,
  );
  const isEditingPosition = positionBeforeEdit !== null;
  const hasPosition = form.longitude !== null && form.latitude !== null;

  const startEditingPosition = () => {
    if (form.longitude !== null && form.latitude !== null) {
      setPositionBeforeEdit({ longitude: form.longitude, latitude: form.latitude });
    }
  };

  const cancelEditingPosition = () => {
    if (positionBeforeEdit) {
      form.setPosition(positionBeforeEdit);
    }
    setPositionBeforeEdit(null);
  };

  return (
    <div className={styles.step}>
      <div>
        <h2 className={styles.title}>Récapitulatif</h2>
        <p className={styles.subtitle}>Vérifiez les informations avant d&apos;envoyer</p>
      </div>

      <div className={styles.photoCard}>
        {form.photo1 ? (
          <img src={form.photo1.previewUrl} alt="" className={styles.photoImage} />
        ) : (
          <div className={styles.photoPlaceholder}>
            <IconCamera className={styles.photoPlaceholderIcon} aria-hidden />
          </div>
        )}
        <EditButton
          label="Modifier la photo"
          className={styles.editButtonOverlay}
          onClick={() => onEditStep(mediaStep)}
        />
      </div>

      <div className={styles.grid}>
        <div className={styles.gridRow}>
          <div className={joinCSSClassNames(styles.card, styles.cardTop, styles.cardWithEditButtonOnLabel)}>
            <p className={styles.cardLabel}>État signalé</p>
            <p className={styles.cardValue}>
              <span className={styles.cardValueText}>{isConform ? 'Conforme' : 'Non conforme'}</span>
            </p>
            <EditButton
              label="Modifier l'état signalé"
              className={styles.editButtonCorner}
              onClick={() => onEditStep(0)}
            />
          </div>

          <div className={joinCSSClassNames(styles.card, styles.cardTop)}>
            <p className={styles.cardLabel}>Date</p>
            <p className={styles.cardValue}>{formatDate(new Date())}</p>
          </div>
        </div>

        <div className={joinCSSClassNames(styles.card, styles.cardBottom)}>
          <p className={styles.cardLabel}>Position</p>
          <p className={styles.cardValue}>{address ?? '—'}</p>
        </div>
      </div>

      {isEditingPosition ? (
        <div className={styles.mapEditor}>
          <div className={styles.mapPreview}>
            <ReportPositionMap
              longitude={form.longitude}
              latitude={form.latitude}
              initialLongitude={form.initialPosition.longitude}
              initialLatitude={form.initialPosition.latitude}
              canResetPosition={form.canResetPosition}
              onPositionChange={form.setPosition}
              onResetPosition={form.resetPositionToInitial}
              showLayerSwitcher
              showFullscreenButton
              aspectRatio={MAP_ASPECT_RATIO}
            />
          </div>
          <div className={styles.editActions}>
            <Button type="button" variant="outline" fullWidth onClick={cancelEditingPosition}>
              Annuler
            </Button>
            <Button type="button" fullWidth onClick={() => setPositionBeforeEdit(null)}>
              Enregistrer
            </Button>
          </div>
        </div>
      ) : hasPosition ? (
        <div className={styles.mapPreview}>
          <ReportPositionMap
            longitude={form.longitude}
            latitude={form.latitude}
            onPositionChange={() => {}}
            readOnly
            showLayerSwitcher
            showFullscreenButton
            aspectRatio={MAP_ASPECT_RATIO}
          />
          {form.canEditPosition ? (
            // En bas à gauche : le coin haut droit porte le bouton plein écran.
            <EditButton
              label="Modifier la position"
              className={joinCSSClassNames(styles.editButtonOverlay, styles.editButtonMap)}
              onClick={startEditingPosition}
            />
          ) : null}
        </div>
      ) : null}

      <div className={joinCSSClassNames(styles.commentCard, styles.cardWithEditButton)}>
        <p className={styles.cardLabel}>Commentaire</p>
        <EditButton
          label="Modifier le commentaire"
          className={styles.editButtonCorner}
          onClick={() => onEditStep(mediaStep)}
        />
        <p className={styles.commentBody}>
          {form.comment.trim() ? form.comment : 'Aucun commentaire ajouté.'}
        </p>
      </div>
    </div>
  );
}
