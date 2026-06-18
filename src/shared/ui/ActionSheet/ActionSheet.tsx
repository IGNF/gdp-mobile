import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/ui/Button';
import type { ButtonColor, ButtonVariant } from '@/shared/ui/Button';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import { joinCSSClassNames } from '@/shared/utils/join';
import typography from '@/shared/styles/typography.module.css';
import styles from './ActionSheet.module.css';

const OPEN_ANIMATION_DELAY = 20;
const ANIMATION_DURATION = 300; // ms, matches CSS transition duration

export interface ActionSheetButton {
  label: string;
  onClick: () => void;
  color?: ButtonColor;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
}

export interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: string;
  children?: ReactNode;
  buttons?: ActionSheetButton[];
}

export function ActionSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  buttons = [],
}: ActionSheetProps) {
  const titleId = useId();
  const [isVisible, setIsVisible] = useState(isOpen);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const canCloseFromOverlayRef = useRef(!isOpen);

  if (isOpen && !shouldRender) {
    setShouldRender(true);
  }
  if (!isOpen && isVisible) {
    setIsVisible(false);
  }

  useEffect(() => {
    if (isOpen) {
      canCloseFromOverlayRef.current = false;
      const visibleTimer = setTimeout(() => {
        setIsVisible(true);
      }, OPEN_ANIMATION_DELAY);
      const overlayTimer = setTimeout(() => {
        canCloseFromOverlayRef.current = true;
      }, OPEN_ANIMATION_DELAY + ANIMATION_DURATION);
      return () => {
        clearTimeout(visibleTimer);
        clearTimeout(overlayTimer);
      };
    }

    canCloseFromOverlayRef.current = false;
    const timer = setTimeout(() => {
      setShouldRender(false);
    }, ANIMATION_DURATION);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleOverlayClick = useCallback(() => {
    if (canCloseFromOverlayRef.current) {
      onClose();
    }
  }, [onClose]);

  if (!shouldRender) return null;

  const content = (
    <>
      <div
        className={joinCSSClassNames(
          styles.overlay,
          isVisible && styles.overlayVisible
        )}
        onClick={handleOverlayClick}
      />
      <section
        className={joinCSSClassNames(
          styles.sheet,
          isVisible && styles.sheetVisible
        )}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={typography.heading2}>
            {title}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label='Close'
          >
            <IconClose className={styles.closeIcon} />
          </button>
        </div>

        <div className={styles.content} data-scroll-root='true'>
          {subtitle && <p className={typography.body}>{subtitle}</p>}

          {children && <div className={styles.childrenContainer}>{children}</div>}

          {buttons.length > 0 && (
            <div className={styles.buttons}>
              {buttons.map((btn) => (
                <Button
                  key={btn.label}
                  color={btn.color}
                  variant={btn.variant}
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  loading={btn.loading}
                  fullWidth
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );

  return createPortal(content, document.body);
}
