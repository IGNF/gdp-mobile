import { useState, type ChangeEvent } from 'react';

import { ReportPositionMap } from '@/features/report/components/ReportPositionMap';
import type { UseGeodesyPointReportFormReturn } from '@/features/report/hooks/useGeodesyPointReportForm';
import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';
import IconCamera from '@/shared/assets/icons/icon-camera.svg?react';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconLocation from '@/shared/assets/icons/icon-location.svg?react';

import styles from './ReportWizardStepMedia.module.css';

const PHOTO_INSTRUCTIONS = [
  'Cadrez le point dans son environnement',
  'Assurez une bonne luminosité',
  'Lorem ipsum dolor sit amet',
  'Lorem ipsum dolor sit amet',
];

export interface ReportWizardStepMediaProps {
  form: UseGeodesyPointReportFormReturn;
}

export function ReportWizardStepMedia({ form }: ReportWizardStepMediaProps) {
  const [isPositionMapOpen, setIsPositionMapOpen] = useState(false);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    form.setPhotoForRole('photo1', file);
    event.target.value = '';
  };

  const handleRemovePhoto = () => {
    form.setPhotoForRole('photo1', null);
  };

  return (
    <div className={styles.step}>
      <h2 className={styles.title}>Dites nous en plus</h2>

      <label className={styles.photoDropzone}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.photoInput}
          onChange={handlePhotoChange}
        />
        {form.photo1 ? (
          <span className={styles.photoPreviewWrap}>
            <img src={form.photo1.previewUrl} alt="" className={styles.photoPreview} />
            <button
              type="button"
              className={styles.photoRemove}
              onClick={(event) => {
                event.preventDefault();
                handleRemovePhoto();
              }}
              aria-label="Retirer la photo"
            >
              <IconClose className={styles.photoRemoveIcon} aria-hidden />
            </button>
          </span>
        ) : (
          <span className={styles.photoPlaceholder}>
            <span className={styles.photoIconWrap}>
              <IconCamera className={styles.photoIcon} aria-hidden />
            </span>
            <span className={styles.photoLabel}>Ajouter une photo</span>
          </span>
        )}
      </label>
      {form.errors.photo1 ? <p className={styles.errorText}>{form.errors.photo1}</p> : null}

      <div className={styles.instructions}>
        <p className={styles.instructionsTitle}>Indications pour la prise de photo :</p>
        <ul className={styles.instructionsList}>
          {PHOTO_INSTRUCTIONS.map((instruction, index) => (
            <li key={index} className={styles.instructionsItem}>
              <IconCheck className={styles.instructionsIcon} aria-hidden />
              {instruction}
            </li>
          ))}
        </ul>
      </div>

      <textarea
        className={styles.commentInput}
        placeholder="Décrivez ce que vous avez observé…"
        value={form.comment}
        onChange={(event) => form.setComment(event.target.value)}
        rows={3}
      />

      {form.canEditPosition ? (
        <div className={styles.positionSection}>
          <button
            type="button"
            className={styles.positionRow}
            onClick={() => setIsPositionMapOpen((current) => !current)}
            aria-expanded={isPositionMapOpen}
          >
            <span className={styles.positionIconWrap} aria-hidden>
              <IconLocation className={styles.positionIcon} />
            </span>
            <span className={styles.positionLabel}>Modifier la position du point</span>
            <IconAngleRight className={styles.positionChevron} aria-hidden />
          </button>

          {isPositionMapOpen ? (
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
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
