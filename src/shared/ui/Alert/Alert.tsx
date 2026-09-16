import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/ui/Button';
import type { ButtonColor, ButtonVariant } from '@/shared/ui/Button';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import { joinCSSClassNames } from '@/shared/utils/join';
import { useDragToDismiss } from './useDragToDismiss';
import styles from './Alert.module.css';

const ANIMATION_DURATION = 200; // ms, matches CSS transition duration

export interface AlertButton {
	label: string;
	onClick: () => void;
	color?: ButtonColor;
	variant?: ButtonVariant;
	disabled?: boolean;
	loading?: boolean;
}

export interface AlertProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	subtitle?: string;
	children?: ReactNode;
	buttons?: AlertButton[];
	size?: 'default' | 'wide';
	showCloseButton?: boolean;
	/** Icône affichée dans un badge rond centré au-dessus du titre. */
	icon?: ReactNode;
	/** Couleur de fond du badge d'icône (ex. `var(--figma-blue-2)`). */
	iconBackground?: string;
	/** Couleur de l'icône elle-même (ex. `var(--figma-blue-5)`). */
	iconColor?: string;
	/** 'bottom' ancre la carte en bas de l'écran, façon fenêtre glissante. */
	placement?: 'center' | 'bottom';
}

export function Alert({
	isOpen,
	onClose,
	title,
	subtitle,
	children,
	buttons = [],
	size = 'default',
	showCloseButton = true,
	icon,
	iconBackground,
	iconColor,
	placement = 'center',
}: AlertProps) {
	const [isVisible, setIsVisible] = useState(isOpen);
	const [shouldRender, setShouldRender] = useState(isOpen);

	if (isOpen && !shouldRender) {
		setShouldRender(true);
	}
	if (!isOpen && isVisible) {
		setIsVisible(false);
	}

	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => {
				setIsVisible(true);
			}, 20);
			return () => clearTimeout(timer);
		} else {
			const timer = setTimeout(() => {
				setShouldRender(false);
			}, ANIMATION_DURATION);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	const isBottomSheet = placement === 'bottom';
	const { offset: dragOffset, dragHandleProps } = useDragToDismiss(
		onClose,
		isBottomSheet && showCloseButton
	);

	if (!shouldRender) return null;

	const content = (
		<div
			className={joinCSSClassNames(
				styles.overlay,
				isVisible && styles.overlayVisible,
				isBottomSheet && styles.overlayBottom
			)}
			onClick={showCloseButton ? onClose : undefined}
		>
			<div
				className={joinCSSClassNames(
					styles.card,
					size === 'wide' && styles.cardWide,
					isBottomSheet && styles.cardBottom
				)}
				style={
					isBottomSheet && dragOffset > 0
						? { transform: `translateY(${dragOffset}px)`, transition: 'none' }
						: undefined
				}
				onClick={(e) => e.stopPropagation()}
			>
				{isBottomSheet ? (
					showCloseButton ? (
						<div className={styles.handleArea} {...dragHandleProps}>
							<span className={styles.handle} aria-hidden />
						</div>
					) : null
				) : showCloseButton ? (
					<button
						className={styles.closeButton}
						onClick={onClose}
						aria-label="Fermer"
					>
						<IconClose className={styles.closeIcon} />
					</button>
				) : null}

				<div
					className={joinCSSClassNames(styles.content, icon ? styles.contentCentered : undefined)}
					data-scroll-root='true'
				>
					{icon ? (
						<span
							className={styles.iconBadge}
							style={{ background: iconBackground, color: iconColor }}
						>
							{icon}
						</span>
					) : null}
					<h2 className="heading-2">{title}</h2>
					{subtitle && <p className="body">{subtitle}</p>}

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
								>
									{btn.label}
								</Button>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);

	return createPortal(content, document.body);
}
