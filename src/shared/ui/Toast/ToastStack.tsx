import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { ALERT_OUTSIDE_CLICK_IGNORE_ATTRIBUTE } from '@/shared/ui/Alert';
import { Toast } from './Toast';
import styles from './Toast.module.css';

export interface ToastStackItem {
	id: string;
	message: string;
	icon?: ReactNode;
	iconBackground?: string;
	iconColor?: string;
}

export interface ToastStackProps {
	items: ToastStackItem[];
	onItemClick: (id: string) => void;
	onItemDismiss: (id: string) => void;
	durationMs?: number;
}

/**
 * Pile de flash messages ancrée en bas à droite. Les items sont rendus dans l'ordre
 * `items` (le plus ancien en premier) : avec la mise en page en colonne inversée, le plus
 * ancien reste au plus près du coin (position « active »), les suivants s'empilent
 * au-dessus. Quand l'item du bas disparaît, celui juste au-dessus glisse à sa place
 * grâce à l'effondrement CSS de sa case (voir `.slot` dans Toast.module.css) — aucune
 * animation JS n'est nécessaire pour ce mouvement de descente.
 */
export function ToastStack({ items, onItemClick, onItemDismiss, durationMs }: ToastStackProps) {
	if (items.length === 0) {
		return null;
	}

	return createPortal(
		<ol className={styles.stack} {...{ [ALERT_OUTSIDE_CLICK_IGNORE_ATTRIBUTE]: '' }}>
			{items.map((item) => (
				<Toast
					key={item.id}
					message={item.message}
					icon={item.icon}
					iconBackground={item.iconBackground}
					iconColor={item.iconColor}
					durationMs={durationMs}
					onClick={() => onItemClick(item.id)}
					onDismiss={() => onItemDismiss(item.id)}
				/>
			))}
		</ol>,
		document.body,
	);
}
