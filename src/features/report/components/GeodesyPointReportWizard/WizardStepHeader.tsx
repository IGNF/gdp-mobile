import styles from './WizardStepHeader.module.css';

export interface WizardStepHeaderProps {
  pointId?: string;
  step: number;
  totalSteps: number;
}

export function WizardStepHeader({ pointId, step, totalSteps }: WizardStepHeaderProps) {
  const progressPercent = Math.min(100, Math.max(0, (step / totalSteps) * 100));

  return (
    <div className={styles.headerBlock}>
      <div className={styles.titleRow}>
        <p className={styles.title}>Signaler</p>
        <span className={styles.stepCounter}>
          {step}/{totalSteps}
        </span>
      </div>
      {pointId ? <p className={styles.pointId}>ID_{pointId}</p> : null}
      <div className={styles.divider} />
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  );
}
