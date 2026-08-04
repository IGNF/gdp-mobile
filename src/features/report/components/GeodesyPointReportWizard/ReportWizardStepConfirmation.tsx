import { Button } from '@/shared/ui/Button';
import IconArticle from '@/shared/assets/icons/icon-article.svg?react';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';

import styles from './ReportWizardStepConfirmation.module.css';

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export interface ReportWizardStepConfirmationProps {
  onSendLater: () => void;
  onSendNow: () => void;
}

export function ReportWizardStepConfirmation({
  onSendLater,
  onSendNow,
}: ReportWizardStepConfirmationProps) {
  return (
    <div className={styles.step}>
      <div className={styles.iconWrap}>
        <span className={styles.rays} aria-hidden>
          {RAY_ANGLES.map((angle) => (
            <span key={angle} className={styles.ray} style={{ transform: `rotate(${angle}deg)` }} />
          ))}
        </span>
        <span className={styles.iconCircle}>
          <IconArticle className={styles.icon} aria-hidden />
          <span className={styles.iconBadge}>
            <IconCheck className={styles.iconBadgeSvg} aria-hidden />
          </span>
        </span>
      </div>

      <h2 className={styles.title}>Signalement enregistré !</h2>
      <p className={styles.body}>
        Votre signalement a été sauvegardé localement. Voulez-vous l&apos;envoyer maintenant ?
        Retrouvez-le dans la page « signalements ».
      </p>

      <div className={styles.actions}>
        <Button type="button" variant="outline" fullWidth onClick={onSendLater}>
          Envoyer plus tard
        </Button>
        <Button type="button" fullWidth onClick={onSendNow}>
          Envoyer maintenant
        </Button>
      </div>
    </div>
  );
}
