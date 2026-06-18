import { joinCSSClassNames } from "@/shared/utils/join";
import styles from './Divider.module.css';

export interface DividerProps {
  className?: string;
  color?: 'light' | 'dark';
  thickness?: 'thin' | 'thick';
  width?: 'full' | 'content' | number;
}

export function Divider({ className = '', color = 'light', thickness = 'thin', width = 'content' }: DividerProps) {
  const classNames = joinCSSClassNames(
    className,
    color === 'light' ? styles.light : styles.dark,
    thickness === 'thin' ? styles.thin : styles.thick,
    typeof width !== 'number' ? styles[width] : ''
  );
  const style = typeof width === 'number' ? { width: `${width}%` } : undefined;
  return <hr className={classNames} style={style} />;
}