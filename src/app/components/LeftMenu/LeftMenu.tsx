import { useEffect, useRef, useState } from 'react';
import { IonMenu } from '@ionic/react';

import type { AppUser } from '@/domain/user/models';

import IconAngleDown from '@/shared/assets/icons/icon-angle-down.svg?react';
import IconConfiguration from '@/shared/assets/icons/icon-configuration.svg?react';
import IconHelp from '@/shared/assets/icons/icon-help.svg?react';
import IconInfo from '@/shared/assets/icons/icon-info.svg?react';
import IconLocation from '@/shared/assets/icons/icon-location.svg?react';
import IconUser from '@/shared/assets/icons/icon-user.svg?react';

import styles from './LeftMenu.module.css';

export interface LeftMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user?: AppUser | null;
  isAuthenticated: boolean;
  onNavigate: (route: string) => void;
}

type MenuGroupId = 'signalements' | 'monCompte';

interface MenuItem {
  id: string;
  label: string;
  route: string;
  hidden?: boolean;
}

interface MenuGroup {
  id: MenuGroupId;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    id: 'signalements',
    title: 'Signalements',
    icon: IconLocation,
    items: [
      { id: 'mesSignalements', label: 'Mes signalements', route: '/reports' },
      { id: 'nouveauSignalement', label: 'Nouveau signalement repère', route: '/report/geodesy/new' },
    ],
  },
  {
    id: 'monCompte',
    title: 'Mon compte',
    icon: IconUser,
    items: [
      { id: 'monCompte', label: 'Mon compte', route: '/my-account' },
      {
        id: 'deconnexion',
        label: 'Déconnexion',
        route: '/logout',
        hidden: false,
      },
      {
        id: 'connexion',
        label: 'Se connecter',
        route: '/login',
        hidden: false,
      },
    ],
  },
];

const standaloneItems = [
  { id: 'parametres', label: 'Paramètres', icon: IconConfiguration, route: '/settings' },
  { id: 'aide', label: 'Aide', icon: IconHelp, route: '/help' },
  { id: 'aPropos', label: 'À propos', icon: IconInfo, route: '/about' },
] as const;

function getUserInitial(user: AppUser | null | undefined): string {
  if (!user?.username) {
    return '?';
  }
  return user.username.charAt(0).toUpperCase();
}

export function LeftMenu({
  isOpen,
  onClose,
  user,
  isAuthenticated,
  onNavigate,
}: LeftMenuProps) {
  const menuRef = useRef<HTMLIonMenuElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<MenuGroupId>>(new Set());

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) {
      return;
    }

    if (isOpen) {
      void menu.open();
    } else {
      void menu.close();
    }
  }, [isOpen]);

  const toggleGroup = (groupId: MenuGroupId) => {
    setExpandedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleItemClick = (route: string) => {
    onClose();
    window.setTimeout(() => {
      onNavigate(route);
    }, 300);
  };

  const getGroupItems = (group: MenuGroup): MenuItem[] => {
    if (group.id !== 'monCompte') {
      return group.items;
    }

    return group.items.filter((item) => {
      if (item.id === 'deconnexion') {
        return isAuthenticated;
      }
      if (item.id === 'connexion') {
        return !isAuthenticated;
      }
      return true;
    });
  };

  return (
    <IonMenu
      ref={menuRef}
      menuId="left-menu"
      contentId="main-content"
      side="start"
      aria-label="Menu principal"
      className={styles.menu}
      onIonDidClose={onClose}
    >
      <div className={styles.menuInner}>
        <p className="debug-banner">TODO — Écran pas encore développé</p>
        <div className={styles.userSection}>
          <div className={styles.avatar}>
            <div className={styles.avatarPlaceholder}>{getUserInitial(user)}</div>
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {isAuthenticated && user?.username ? user.username : 'Non connecté'}
            </span>
            <span className={styles.userSubtitle}>
              {isAuthenticated && user?.email
                ? user.email
                : 'Connectez-vous pour consulter vos signalements envoyés'}
            </span>
          </div>
        </div>

        <div className={styles.menuContent}>
          {menuGroups.map((group) => {
            const IconComponent = group.icon;
            const isExpanded = expandedGroups.has(group.id);
            const items = getGroupItems(group);

            return (
              <div key={group.id} className={styles.menuGroup}>
                <button
                  type="button"
                  className={styles.groupHeader}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isExpanded}
                >
                  <IconComponent className={styles.groupIcon} aria-hidden />
                  <span className={styles.groupTitle}>{group.title}</span>
                  <IconAngleDown
                    className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
                    aria-hidden
                  />
                </button>
                <div
                  className={`${styles.groupItems} ${isExpanded ? styles.groupItemsExpanded : ''}`}
                >
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={styles.menuItem}
                      onClick={() => handleItemClick(item.route)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div className={styles.standaloneItems}>
            {standaloneItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={styles.standaloneItem}
                  onClick={() => handleItemClick(item.route)}
                >
                  <IconComponent className={styles.standaloneIcon} aria-hidden />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </IonMenu>
  );
}
