import type { AnchorHTMLAttributes, ReactNode } from 'react';
import styles from './ExternalLink.module.css';
import IconExternalLink from '@/shared/assets/icons/icon-external-link.svg?react';
import { joinCSSClassNames } from '@/shared/utils/join';

export interface ExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
  href: string
  showIcon?: boolean
}

export function ExternalLink({
  children,
  href,
  showIcon = true,
  className,
  target = '_blank',
  rel = 'noopener noreferrer',
  ...rest
}: ExternalLinkProps) {
  const classNames = joinCSSClassNames(styles.externalLink, className);

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={classNames}
      {...rest}
    >
      {children}
      {showIcon && (
        <IconExternalLink className={styles.icon} aria-hidden />
      )}
    </a>
  );
}
