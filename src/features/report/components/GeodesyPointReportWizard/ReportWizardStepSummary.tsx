import type { GeodesyPointReportContext } from '@ign/gdp-tools';

import type { UseGeodesyPointReportFormReturn } from '@/features/report/hooks/useGeodesyPointReportForm';
import IconArticle from '@/shared/assets/icons/icon-article.svg?react';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconEdit from '@/shared/assets/icons/icon-edit.svg?react';
import IconGallery from '@/shared/assets/icons/icon-gallery.svg?react';
import IconLocation from '@/shared/assets/icons/icon-location.svg?react';

import styles from './ReportWizardStepSummary.module.css';

export interface ReportWizardStepSummaryProps {
  reportContext: GeodesyPointReportContext;
  form: UseGeodesyPointReportFormReturn;
  onEditStep: (step: 1 | 2) => void;
}

export function ReportWizardStepSummary({ reportContext, form, onEditStep }: ReportWizardStepSummaryProps) {
  const heroPhoto = form.photo1 ?? form.photo2;
  const stateValue = 'Lorem ipsum';

  return (
    <div className={styles.step}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Récapitulatif</h1>
        <p className={styles.subtitle}>Vérifiez les informations avant d’envoyer</p>
      </div>

      <div className={styles.hero}>
        {heroPhoto ? (
          <img src={heroPhoto.previewUrl} alt="" className={styles.heroImage} />
        ) : (
          <div className={styles.heroFallback}>
            <IconGallery className={styles.heroFallbackIcon} aria-hidden />
          </div>
        )}
        <button
          type="button"
          className={styles.heroEditButton}
          onClick={() => onEditStep(2)}
          aria-label="Modifier la photo"
        >
          <IconEdit aria-hidden />
        </button>
        <div className={styles.heroCaption}>
          <span>PHOTO PRINCIPALE</span>
        </div>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <span className={styles.infoIcon}>
            <IconCheck aria-hidden />
          </span>
          <button
            type="button"
            className={styles.infoEditButton}
            onClick={() => onEditStep(1)}
            aria-label="Modifier l’état"
          >
            <IconEdit aria-hidden />
          </button>
          <span className={styles.infoLabel}>État</span>
          <span className={styles.infoValue}>{stateValue}</span>
          <span className={styles.infoSubvalue}>{reportContext.title}</span>
        </div>

        <div className={styles.infoCard}>
          <span className={styles.infoIcon}>
            <IconLocation aria-hidden />
          </span>
          <button
            type="button"
            className={styles.infoEditButton}
            onClick={() => onEditStep(2)}
            aria-label="Modifier la position"
          >
            <IconEdit aria-hidden />
          </button>
          <span className={styles.infoLabel}>Position</span>
          <span className={styles.infoValue}>{form.canEditPosition ? 'Confirmée' : 'Point fixe'}</span>
          <span className={styles.infoSubvalue}>
            {form.latitude.toFixed(4)}° N, {form.longitude.toFixed(4)}° E
          </span>
        </div>
      </div>

      <div className={styles.commentCard}>
        <div className={styles.commentHeader}>
          <span className={styles.commentHeaderLeft}>
            <IconArticle className={styles.commentIcon} aria-hidden />
            <span className={styles.commentLabel}>Commentaire</span>
          </span>
          <button type="button" className={styles.commentEditButton} onClick={() => onEditStep(2)}>
            <IconEdit className={styles.commentEditIcon} aria-hidden />
            modifier
          </button>
        </div>
        <p className={styles.commentText}>
          {form.comment.trim() || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
        </p>
      </div>
    </div>
  );
}
