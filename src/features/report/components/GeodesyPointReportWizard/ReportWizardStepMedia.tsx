import { useState, type ChangeEvent } from 'react';
import { RiImageLine } from 'react-icons/ri';

import { ReportPositionEditorSection } from '@/features/report/components/ReportPositionEditorSection';
import type { UseGeodesyPointReportFormReturn } from '@/features/report/hooks/useGeodesyPointReportForm';
import { Loading } from '@/shared/ui/Loading';
import IconCamera from '@/shared/assets/icons/icon-camera.svg?react';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';

import styles from './ReportWizardStepMedia.module.css';

const PHOTO_INSTRUCTIONS = [
  'Cadrez le point dans son environnement',
  'Assurez une bonne luminosité',
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

      {form.isPhotoProcessing ? (
        <div className={styles.photoDropzone}>
          <span className={styles.photoPlaceholder}>
            <Loading size="small" label="Compression de la photo…" />
          </span>
        </div>
      ) : form.photo1 ? (
        <div className={styles.photoDropzone}>
          <span className={styles.photoPreviewWrap}>
            <img src={form.photo1.previewUrl} alt="" className={styles.photoPreview} />
            <button
              type="button"
              className={styles.photoRemove}
              onClick={handleRemovePhoto}
              aria-label="Retirer la photo"
            >
              <IconClose className={styles.photoRemoveIcon} aria-hidden />
            </button>
          </span>
        </div>
      ) : (
        <div className={styles.photoSourceRow}>
          <label className={styles.photoSourceButton}>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className={styles.photoInput}
              onChange={handlePhotoChange}
            />
            <span className={styles.photoIconWrap}>
              <IconCamera className={styles.photoIcon} aria-hidden />
            </span>
            <span className={styles.photoLabel}>Prendre une photo</span>
          </label>
          <label className={styles.photoSourceButton}>
            <input
              type="file"
              accept="image/*"
              className={styles.photoInput}
              onChange={handlePhotoChange}
            />
            <span className={styles.photoIconWrap}>
              <RiImageLine className={styles.photoIcon} aria-hidden />
            </span>
            <span className={styles.photoLabel}>Choisir dans la galerie</span>
          </label>
        </div>
      )}
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

      <ReportPositionEditorSection
        form={form}
        isOpen={isPositionMapOpen}
        onToggle={() => setIsPositionMapOpen((current) => !current)}
      />
    </div>
  );
}
