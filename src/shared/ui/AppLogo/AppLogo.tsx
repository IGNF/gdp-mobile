import logo from '@/assets/img/logo.png';

import styles from './AppLogo.module.css';

export type AppLogoSize = 'sm' | 'md' | 'lg';

export interface AppLogoProps {
  size?: AppLogoSize;
  className?: string;
  alt?: string;
}

export function AppLogo({ size = 'md', className, alt = 'Géodésie de poche' }: AppLogoProps) {
  return (
    <img
      src={logo}
      alt={alt}
      className={[styles.logo, styles[size], className].filter(Boolean).join(' ')}
    />
  );
}
