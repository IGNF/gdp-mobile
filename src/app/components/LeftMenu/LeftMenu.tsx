import { useState } from 'react';

import type { AppUser } from '@/domain/user/models';
import { config } from '@/shared/config/env';

import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';
import IconSettings from '@/shared/assets/icons/icon-settings.svg?react';
import IconHelp from '@/shared/assets/icons/icon-help.svg?react';
import IconInfo from '@/shared/assets/icons/icon-info.svg?react';
import IconUser from '@/shared/assets/icons/icon-user.svg?react';
import IconStar from '@/shared/assets/icons/icon-heart.svg?react';
import IconTeam from '@/shared/assets/icons/icon-team.svg?react';
import IconDisconnect from '@/shared/assets/icons/icon-deconnect.svg?react';

import screen from '@/shared/styles/screen.module.css';

import styles from './LeftMenu.module.css';

export interface LeftMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user?: AppUser | null;
  isAuthenticated: boolean;
  onNavigate: (route: string) => void;
}

/** `always` = visible pour tous ; `authenticated` = connecté ; `guest` = non connecté */
type AuthVisibility = 'always' | 'authenticated' | 'guest';

type MenuGroupId = 'monCompte' | 'mesFavoris' | 'parametres' | 'communaute' | 'aide' | 'aPropos';

interface MenuItem {
  id: string;
  label: string;
  route: string;
  authVisibility?: AuthVisibility;
}

interface MenuGroup {
  id: MenuGroupId;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  items: MenuItem[];
  authVisibility?: AuthVisibility;
}

interface StandaloneItem {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  route: string;
  authVisibility?: AuthVisibility;
}

const menuGroups: MenuGroup[] = [
  {
    id: 'monCompte',
    title: 'Mon compte',
    icon: IconUser,
    authVisibility: 'authenticated',
    items: [
      { id: 'monCompte', label: 'Mon compte', route: '/my-account' },
    ],
  },
  {
    id: 'mesFavoris',
    title: 'Mes favoris',
    icon: IconStar,
    authVisibility: 'authenticated',
    items: [{ id: 'mesFavoris', label: 'Mes favoris', route: '/favorites' }],
  },
  {
    id: 'parametres',
    title: 'Paramètres',
    icon: IconSettings,
    items: [{ id: 'parametres', label: 'Paramètres', route: '/settings' }],
  },
  {
    id: 'communaute',
    title: 'Communauté',
    icon: IconTeam,
    items: [{ id: 'communaute', label: 'Communauté', route: '/community' }],
  },
  {
    id: 'aide',
    title: 'Aide',
    icon: IconHelp,
    items: [{ id: 'aide', label: 'Aide', route: '/help' }],
  },
  {
    id: 'aPropos',
    title: 'À propos',
    icon: IconInfo,
    items: [{ id: 'aPropos', label: 'À propos', route: '/about' }],
  },
];

const standaloneItems: StandaloneItem[] = [
  {
    id: 'connexion',
    label: 'Se connecter',
    icon: IconUser,
    route: '/login',
    authVisibility: 'guest',
  },
  {
    id: 'deconnexion',
    label: 'Déconnexion',
    icon: IconDisconnect,
    route: '/logout',
    authVisibility: 'authenticated',
  },
];

function isAuthVisible(visibility: AuthVisibility = 'always', isAuthenticated: boolean): boolean {
  if (visibility === 'authenticated') {
    return isAuthenticated;
  }
  if (visibility === 'guest') {
    return !isAuthenticated;
  }
  return true;
}

function resolveUserAvatarUrl(avatar: string | undefined): string | null {
  const trimmed = avatar?.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('/')) {
    return trimmed;
  }

  try {
    return new URL(trimmed, config.api.baseUrl).href;
  } catch {
    return trimmed;
  }
}

function UserAvatar({
  user,
  isAuthenticated,
}: {
  user: AppUser | null | undefined;
  isAuthenticated: boolean;
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const avatarUrl = isAuthenticated ? resolveUserAvatarUrl(user?.avatar) : null;
  const showImage = Boolean(avatarUrl) && !hasImageError;

  if (showImage && avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={styles.avatarImage}
        onError={() => setHasImageError(true)}
      />
    );
  }

  return <IconUser className={styles.avatarIcon} aria-hidden />;
}

export function LeftMenu({
  isOpen,
  onClose,
  user,
  isAuthenticated,
  onNavigate,
}: LeftMenuProps) {
  const visibleGroups = menuGroups
    .filter((group) => isAuthVisible(group.authVisibility, isAuthenticated))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        isAuthVisible(item.authVisibility, isAuthenticated),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const visibleStandaloneItems = standaloneItems.filter((item) =>
    isAuthVisible(item.authVisibility, isAuthenticated),
  );

  const handleItemClick = (route: string) => {
    onNavigate(route);
    onClose();
  };

  return (
    <>
      <div
        className={`${screen.overlay} ${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        className={`${styles.menu} ${isOpen ? styles.menuOpen : ''}`}
        aria-label="Menu principal"
        aria-hidden={!isOpen}
      >
        <div className={styles.userSection}>
          <div className={styles.avatar}>
            <div className={styles.avatarPlaceholder}>
              <UserAvatar
                key={isAuthenticated ? (user?.avatar ?? 'auth') : 'guest'}
                user={user}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {isAuthenticated && user?.username ? user.username : 'Bonjour'}
            </span>
            {isAuthenticated && user?.email ? (
              <span className={styles.userSubtitle}>{user.email}</span>
            ) : (
              <button
                type="button"
                className={styles.userSubtitleLink}
                onClick={() => handleItemClick('/login')}
              >
                Pas encore connecté ?
              </button>
            )}
          </div>
        </div>

        <div className={styles.menuContent}>
          {visibleGroups.map((group) => {
            const IconComponent = group.icon;
            const route = group.items[0]?.route;
            if (!route) {
              return null;
            }

            return (
              <div key={group.id} className={styles.menuGroup}>
                <button
                  type="button"
                  className={styles.groupHeader}
                  onClick={() => handleItemClick(route)}
                >
                  <IconComponent className={styles.groupIcon} aria-hidden />
                  <span className={styles.groupTitle}>{group.title}</span>
                  <IconAngleRight className={styles.chevron} aria-hidden />
                </button>
              </div>
            );
          })}

          {visibleStandaloneItems.length > 0 ? (
            <div className={styles.standaloneItems}>
              {visibleStandaloneItems.map((item) => {
                const IconComponent = item.icon;
                const isPrimaryButton = item.id === 'connexion';
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.standaloneItem} ${isPrimaryButton ? styles.standaloneItemPrimary : ''}`}
                    onClick={() => handleItemClick(item.route)}
                  >
                    <span>{item.label}</span>
                    {!isPrimaryButton && <IconComponent className={styles.standaloneIcon} aria-hidden />}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </nav>
    </>
  );
}
