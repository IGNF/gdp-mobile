import styles from './WizardStepHeader.module.css';

export interface WizardStepHeaderProps {
  pointId?: string;
  step: number;
  totalSteps: number;
}

export function WizardStepHeader({ pointId, step, totalSteps }: WizardStepHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.row}>
        <div className={styles.titleBlock}>
          <p className={styles.title}>Signaler</p>
          {pointId ? <p className={styles.pointId}>{pointId}</p> : null}
        </div>
        <span className={styles.counter}>
          {step}/{totalSteps}
        </span>
      </div>
      <div className={styles.separator} />
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${(step / totalSteps) * 100}%` }} />
      </div>
    </div>
  );
}
