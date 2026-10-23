import { Button } from '@/shared/ui/Button';
import ReportDoneIllustration from '@/shared/assets/icons/report-done.svg?react';

import styles from './ReportWizardStepConfirmation.module.css';

export interface ReportWizardStepConfirmationProps {
  onSendLater: () => void;
  onSendNow: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export function ReportWizardStepConfirmation({
  onSendLater,
  onSendNow,
  isSubmitting = false,
  submitError = null,
}: ReportWizardStepConfirmationProps) {
  return (
    <div className={styles.step}>
      <ReportDoneIllustration className={styles.illustration} aria-hidden />

      <h2 className={styles.title}>Signalement enregistré !</h2>
      <p className={styles.body}>
        Votre signalement a été sauvegardé localement. Voulez-vous l&apos;envoyer maintenant ?
        Retrouvez-le dans la page « signalements ».
      </p>
      {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

      <div className={styles.actions}>
        <Button
          type="button"
          variant="outline"
          fullWidth
          className={styles.sendLater}
          onClick={onSendLater}
          disabled={isSubmitting}
        >
          Envoyer plus tard
        </Button>
        <Button type="button" fullWidth onClick={onSendNow} loading={isSubmitting}>
          Envoyer maintenant
        </Button>
      </div>
    </div>
  );
}
