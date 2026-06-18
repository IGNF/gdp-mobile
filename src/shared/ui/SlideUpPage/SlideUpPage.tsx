import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { joinCSSClassNames } from '@/shared/utils/join';
import styles from './SlideUpPage.module.css';

const ANIMATION_DURATION = 300; //ms, matches CSS transition duration
const BASE_Z_INDEX = 100;

export interface SlideUpPageProps {
	children: ReactNode;
	isOpen: boolean;
	onClose: () => void;
	className?: string;
	/**
	 * Stack level for nested modals. Higher levels appear on top.
	 * Default is 1. Use 2 for modals opened from within another modal.
	 */
	level?: number;
	/**
	 * Whether this is a full-page overlay that needs safe area padding.
	 * Set to false for partial overlays (e.g., with top: 10%) that already have spacing.
	 * Default is true.
	 */
	fullPage?: boolean;
}

export function SlideUpPage({ children, isOpen, className, level = 1, fullPage = true }: SlideUpPageProps) {
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

	if (!shouldRender) return null;

	const classNames = joinCSSClassNames(
		styles.slideUpPage,
		isVisible ? styles.slideUpPageVisible : '',
		className
	);

	const innerClassNames = joinCSSClassNames(
		styles.slideUpPageInner,
		fullPage ? styles.slideUpPageInnerFullPage : ''
	);

	const zIndex = BASE_Z_INDEX + (level - 1) * 10;

	const content = (
		<div className={classNames} style={{ zIndex }} data-scroll-root='true'>
			<div className={innerClassNames}>
				{children}
			</div>
		</div>
	);

	// Use portal to render at document body level for proper stacking
	return createPortal(content, document.body);
}
