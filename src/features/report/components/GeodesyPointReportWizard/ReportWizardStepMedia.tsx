import { useId } from 'react';

import { ReportPositionMap } from '@/features/report/components/ReportPositionMap';
import type { UseGeodesyPointReportFormReturn } from '@/features/report/hooks/useGeodesyPointReportForm';

import IconCamera from '@/shared/assets/icons/icon-camera.svg?react';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconLocation from '@/shared/assets/icons/icon-location.svg?react';
import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';

import styles from './ReportWizardStepMedia.module.css';

export interface ReportWizardStepMediaProps {
  form: UseGeodesyPointReportFormReturn;
}

const PHOTO_TIPS = [
  'Cadrez le point dans son environnement',
  'Assurez une bonne luminosité',
  'Lorem ipsum dolor sit amet',
  'Lorem ipsum dolor sit amet',
];

export function ReportWizardStepMedia({ form }: ReportWizardStepMediaProps) {
  const photoInputId = useId();

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    form.setPhotoForRole('photo1', file);
  };

  return (
    <div className={styles.step}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Dites-nous en plus</h1>
      </div>

      <div className={styles.uploadZone}>
        <input
          id={photoInputId}
          type="file"
          accept="image/*"
          className={styles.fileInput}
          onChange={(event) => void handlePhotoChange(event)}
        />
        {form.photo1 ? (
          <div className={styles.previewWrap}>
            <img src={form.photo1.previewUrl} alt="Photo du signalement" className={styles.previewImage} />
            <button
              type="button"
              className={styles.removePhoto}
              onClick={() => form.setPhotoForRole('photo1', null)}
              aria-label="Retirer la photo"
            >
              <IconClose aria-hidden />
            </button>
          </div>
        ) : (
          <label htmlFor={photoInputId} className={styles.uploadLabel}>
            <span className={styles.uploadIcon}>
              <IconCamera aria-hidden />
            </span>
            <span>Ajouter une photo</span>
          </label>
        )}
      </div>
      {form.errors.photo1 ? <p className={styles.error}>{form.errors.photo1}</p> : null}

      <div className={styles.tipsCard}>
        <p className={styles.tipsTitle}>Indications pour la prise de photo :</p>
        <ul className={styles.tipsList}>
          {PHOTO_TIPS.map((tip, index) => (
            <li key={index} className={styles.tipsItem}>
              <IconCheck className={styles.tipsIcon} aria-hidden />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.textareaCard}>
        <textarea
          className={styles.textarea}
          rows={3}
          value={form.comment}
          onChange={(event) => form.setComment(event.target.value)}
          placeholder="Décrivez ce que vous avez observé…"
        />
      </div>

      {form.canEditPosition ? (
        <div className={styles.positionCard}>
          <div className={styles.positionRow}>
            <span className={styles.positionIconWrap}>
              <IconLocation aria-hidden />
            </span>
            <span className={styles.positionLabel}>Modifier la position du point</span>
            <IconAngleRight className={styles.positionChevron} aria-hidden />
          </div>
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
  );
}
