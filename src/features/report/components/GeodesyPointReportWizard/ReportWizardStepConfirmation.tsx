import { Button } from '@/shared/ui/Button';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';

import styles from './ReportWizardStepConfirmation.module.css';

export interface ReportWizardStepConfirmationProps {
  message: string;
  onReturnToMap: () => void;
}

export function ReportWizardStepConfirmation({ message, onReturnToMap }: ReportWizardStepConfirmationProps) {
  return (
    <div className={styles.step}>
      <div className={styles.iconBadge}>
        <IconCheck className={styles.icon} aria-hidden />
      </div>
      <h1 className={styles.title}>Signalement envoyé !</h1>
      <p className={styles.message}>{message}</p>

      <div className={styles.actions}>
        <Button type="button" fullWidth onClick={onReturnToMap}>
          Retour à la carte
        </Button>
        <Button type="button" variant="outline" fullWidth disabled>
          Sauvegarder pour plus tard
        </Button>
        <p className={styles.hint}>Fonctionnalité à venir — l’envoi immédiat est disponible dès maintenant.</p>
      </div>
    </div>
  );
}
