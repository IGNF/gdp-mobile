import { useId, useState } from 'react';
import { Capacitor } from '@capacitor/core';

import type { ReportPhoto } from '@/domain/report/models';
import IconCamera from '@/shared/assets/icons/icon-camera.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';

import styles from './ReportPhotoSlot.module.css';

interface ReportPhotoSlotProps {
  label: string;
  helper: string;
  photo: ReportPhoto | null;
  error?: string;
  onSelectFile: (file: File | null) => Promise<void>;
}

function isWebRuntime(): boolean {
  return !Capacitor.isNativePlatform();
}

export function ReportPhotoSlot({ label, helper, photo, error, onSelectFile }: ReportPhotoSlotProps) {
  const inputId = useId();
  const isWeb = isWebRuntime();
  const [isChecking, setIsChecking] = useState(false);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (!file) {
      return;
    }

    setIsChecking(true);
    try {
      await onSelectFile(file);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRemove = async () => {
    await onSelectFile(null);
  };

  const pickLabel = isWeb ? 'Choisir une photo sur l’ordinateur' : 'Prendre ou choisir une photo';

  return (
    <div className={styles.slot}>
      <div className={styles.slotHeader}>
        <span className={styles.slotLabel}>{label}</span>
        <span className={styles.slotHelper}>{helper}</span>
        <span className={styles.orientationHint}>
          Tenez l’appareil en mode paysage (horizontal) pour la prise de vue.
        </span>
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/*"
        {...(!isWeb ? { capture: 'environment' as const } : {})}
        className={styles.fileInput}
        disabled={isChecking}
        onChange={handleChange}
      />

      {photo ? (
        <div className={styles.previewCard}>
          <img src={photo.previewUrl} alt={label} className={styles.previewImage} />
          <button
            type="button"
            className={styles.removeButton}
            aria-label={`Retirer ${label.toLowerCase()}`}
            onClick={handleRemove}
            disabled={isChecking}
          >
            <IconClose className={styles.removeIcon} aria-hidden />
          </button>
        </div>
      ) : (
        <label htmlFor={inputId} className={styles.emptyCard} aria-disabled={isChecking}>
          <IconCamera className={styles.emptyIcon} aria-hidden />
          <span>{isChecking ? 'Vérification…' : isWeb ? 'Choisir une photo' : 'Ajouter une photo'}</span>
        </label>
      )}

      <label htmlFor={inputId} className={styles.pickAction} aria-disabled={isChecking}>
        {isChecking ? 'Vérification de l’orientation…' : photo ? 'Remplacer la photo' : pickLabel}
      </label>

      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
