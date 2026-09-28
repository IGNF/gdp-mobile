import { useEffect, useState, type ReactNode } from 'react';

import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import { joinCSSClassNames } from '@/shared/utils/join';
import styles from './Toast.module.css';

export const TOAST_EXIT_ANIMATION_DURATION = 250; // ms, matches .slotExiting CSS transition duration
const DEFAULT_DURATION_MS = 5000;

export interface ToastProps {
	/** Texte affiché (généralement le titre du message replié). */
	message: string;
	/** Clic sur le corps du flash : sert à rouvrir le contenu qui vient d'être fermé. */
	onClick: () => void;
	/** Appelé une fois le flash disparu (délai écoulé ou croix cliquée), après son animation de sortie. */
	onDismiss: () => void;
	durationMs?: number;
	icon?: ReactNode;
	/** Couleur de fond du badge d'icône (ex. `var(--figma-blue-2)`). */
	iconBackground?: string;
	/** Couleur de l'icône elle-même (ex. `var(--figma-blue-5)`). */
	iconColor?: string;
}

/**
 * Un flash message, pensé pour vivre dans une pile (voir `ToastStack`) : monté = affiché,
 * démonté = disparu. Son décompte démarre à son montage, indépendamment des autres.
 */
export function Toast({
	message,
	onClick,
	onDismiss,
	durationMs = DEFAULT_DURATION_MS,
	icon,
	iconBackground,
	iconColor,
}: ToastProps) {
	const [isExiting, setIsExiting] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setIsExiting(true), durationMs);
		return () => clearTimeout(timer);
	}, [durationMs]);

	useEffect(() => {
		if (!isExiting) {
			return;
		}
		const timer = setTimeout(onDismiss, TOAST_EXIT_ANIMATION_DURATION);
		return () => clearTimeout(timer);
	}, [isExiting, onDismiss]);

	return (
		<li className={joinCSSClassNames(styles.slot, isExiting && styles.slotExiting)}>
			<div className={styles.slotInner}>
				<div className={styles.toast}>
					<button type="button" className={styles.body} onClick={onClick}>
						{icon ? (
							<span className={styles.iconBadge} style={{ background: iconBackground, color: iconColor }}>
								{icon}
							</span>
						) : null}
						<span className={styles.message}>{message}</span>
					</button>
					<button
						type="button"
						className={styles.closeButton}
						onClick={() => setIsExiting(true)}
						aria-label="Fermer"
					>
						<IconClose className={styles.closeIcon} />
					</button>
				</div>
			</div>
		</li>
	);
}
