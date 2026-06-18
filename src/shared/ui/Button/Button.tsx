import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { joinCSSClassNames } from '@/shared/utils/join';
import styles from './Button.module.css';

export type ButtonColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'light'
  | 'medium'
  | 'dark';

export type ButtonVariant = 'solid' | 'outline' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  color?: ButtonColor;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
  iconOnly?: boolean;
}

export function Button({
  children,
  color = 'primary',
  variant = 'solid',
  fullWidth = false,
  loading = false,
  iconOnly = false,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const classNames = joinCSSClassNames(
    styles.button,
    styles[color],
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    iconOnly ? styles.iconOnly : '',
    className
  );

  return (
    <button className={classNames} disabled={disabled || loading} {...rest}>
      {loading ? <span className={styles.loading} /> : children}
    </button>
  );
}
