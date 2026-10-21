import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { ALERT_OUTSIDE_CLICK_IGNORE_ATTRIBUTE } from '@/shared/ui/Alert';
import { joinCSSClassNames } from '@/shared/utils/join';
import styles from './FlashMessage.module.css';

const DEFAULT_DURATION = 5000; // ms
const ANIMATION_DURATION = 300; // ms, matches CSS transition duration
/** Au-delà de ce déplacement, le geste est un glissement et non un appui. */
const TAP_TOLERANCE_PX = 8;
const SWIPE_DISMISS_THRESHOLD_PX = 80;

type LeaveDirection = 'up' | 'left' | 'right';

export interface FlashMessageProps {
  /** Appelé une fois l'animation de sortie terminée (délai écoulé ou glissement). */
  onClose: () => void;
  onClick?: () => void;
  icon?: ReactNode;
  children: ReactNode;
  /** Durée d'affichage en ms avant fermeture automatique. */
  duration?: number;
}

/**
 * Message flash en haut de l'écran : se ferme seul après `duration`, ou en le faisant glisser
 * vers la gauche ou la droite. À monter conditionnellement — il s'anime à l'apparition.
 */
export function FlashMessage({
  onClose,
  onClick,
  icon,
  children,
  duration = DEFAULT_DURATION,
}: FlashMessageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [leaveDirection, setLeaveDirection] = useState<LeaveDirection | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 20);
    return () => clearTimeout(timer);
  }, []);

  // Le délai repart à zéro après chaque glissement relâché : le message ne disparaît pas sous le doigt.
  useEffect(() => {
    if (isDragging || leaveDirection) {
      return;
    }
    const timer = setTimeout(() => setLeaveDirection('up'), duration);
    return () => clearTimeout(timer);
  }, [isDragging, leaveDirection, duration]);

  useEffect(() => {
    if (!leaveDirection) {
      return;
    }
    const timer = setTimeout(onClose, ANIMATION_DURATION);
    return () => clearTimeout(timer);
  }, [leaveDirection, onClose]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (leaveDirection) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    startXRef.current = event.clientX;
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!isDragging) {
      return;
    }
    const offset = event.clientX - startXRef.current;
    if (Math.abs(offset) > TAP_TOLERANCE_PX) {
      hasMovedRef.current = true;
    }
    setDragOffset(offset);
  };

  const endDrag = () => {
    if (!isDragging) {
      return;
    }
    setIsDragging(false);
    if (Math.abs(dragOffset) > SWIPE_DISMISS_THRESHOLD_PX) {
      setLeaveDirection(dragOffset > 0 ? 'right' : 'left');
    }
    setDragOffset(0);
  };

  const handleClick = () => {
    // Un glissement relâché déclenche aussi un clic : on l'ignore.
    if (hasMovedRef.current || leaveDirection) {
      return;
    }
    onClick?.();
  };

  const content = (
    <div
      className={styles.container}
      role="status"
      aria-live="polite"
      {...{ [ALERT_OUTSIDE_CLICK_IGNORE_ATTRIBUTE]: '' }}
    >
      <button
        type="button"
        className={joinCSSClassNames(
          styles.flash,
          isVisible && styles.flashVisible,
          leaveDirection === 'up' && styles.flashLeaveUp,
          leaveDirection === 'left' && styles.flashLeaveLeft,
          leaveDirection === 'right' && styles.flashLeaveRight,
        )}
        style={
          isDragging
            ? {
                transform: `translateX(${dragOffset}px)`,
                opacity: 1 - Math.min(Math.abs(dragOffset) / 240, 0.6),
                transition: 'none',
              }
            : undefined
        }
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {icon ? <span className={styles.icon} aria-hidden>{icon}</span> : null}
        <span className={styles.text}>{children}</span>
      </button>
    </div>
  );

  return createPortal(content, document.body);
}
