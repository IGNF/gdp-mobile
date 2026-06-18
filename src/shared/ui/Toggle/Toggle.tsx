import { joinCSSClassNames } from '@/shared/utils/join';
import styles from './Toggle.module.css';

export type ToggleColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'danger';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  color?: ToggleColor;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onChange,
  label,
  color = 'primary',
  disabled = false,
}: ToggleProps) {
  const classNames = joinCSSClassNames(
    styles.toggle,
    styles[color],
    disabled ? styles.disabled : ''
  );

  return (
    <label className={classNames}>
      <div className={styles.track}>
        <input
          type="checkbox"
          className={styles.input}
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span className={`${styles.slider} ${checked ? styles.sliderChecked : ''}`}>
          <span className={styles.knob} />
        </span>
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
