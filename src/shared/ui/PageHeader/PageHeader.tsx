import { useNavigate } from 'react-router-dom';
import styles from './PageHeader.module.css';

import IconArrowLeft from '@/shared/assets/icons/icon-arrow-left.svg?react';
import IconBurger from '@/shared/assets/icons/icon-burger.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconSearch from '@/shared/assets/icons/icon-search.svg?react';
import { joinCSSClassNames } from '@/shared/utils/join';

export interface PageHeaderProps {
	title: string;
	subtitle?: string;
	showBackButton?: boolean;
	showCloseButton?: boolean;
	showSearchButton?: boolean;
	isSearchActive?: boolean;
	showMenuButton?: boolean;
	menuButtonVariant?: 'default' | 'primary';
	onBack?: () => void;
	onClose?: () => void;
	onSearchClick?: () => void;
	onMenuClick?: () => void;
}

export function PageHeader({
	title,
	subtitle,
	showBackButton = false,
	showCloseButton = true,
	showSearchButton = false,
	isSearchActive = false,
	showMenuButton = false,
	menuButtonVariant = 'default',
	onBack,
	onClose,
	onSearchClick,
	onMenuClick,
}: PageHeaderProps) {
	const navigate = useNavigate();

	const handleBack = () => {
		if (onBack) {
			onBack();
		} else {
			navigate(-1);
		}
	};

	const handleClose = () => {
		if (onClose) {
			onClose();
		} else {
			navigate(-1);
		}
	};

	return (
		<header className={styles.header}>
			{showBackButton ? (
				<button
					className={styles.headerButton}
					onClick={handleBack}
					aria-label="Back"
				>
					<IconArrowLeft className={styles.headerIcon} />
				</button>
			) : showMenuButton ? (
				<button
					type="button"
					className={joinCSSClassNames(
						styles.headerButton,
						menuButtonVariant === 'primary' ? styles.headerButtonPrimary : '',
					)}
					onClick={onMenuClick}
					aria-label="Menu"
				>
					<IconBurger
						className={joinCSSClassNames(
							styles.headerIcon,
							menuButtonVariant === 'primary' ? styles.headerIconOnPrimary : '',
						)}
					/>
				</button>
			) : (
				<div className={styles.headerSpacer} />
			)}

			<div className={styles.headerTitle}>
				<h1 className={styles.headerMainTitle}>{title}</h1>
				{subtitle && <p className={styles.headerSubtitle}>{subtitle}</p>}
			</div>

			{showSearchButton ? (
				<button
					type="button"
					className={`${styles.headerButton} ${isSearchActive ? styles.headerButtonActive : ''}`}
					onClick={onSearchClick}
					aria-label="Rechercher"
					aria-pressed={isSearchActive}
				>
					<IconSearch className={styles.headerIcon} />
				</button>
			) : showCloseButton ? (
				<button
					className={styles.headerButton}
					onClick={handleClose}
					aria-label="Close"
				>
					<IconClose className={styles.headerIcon} />
				</button>
			) : (
				<div className={styles.headerSpacer} />
			)}
		</header>
	);
}
