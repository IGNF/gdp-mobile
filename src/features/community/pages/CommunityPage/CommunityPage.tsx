import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  COMMUNITY_THEME_FILTER_ALL,
  useCommunityStats,
} from '@/features/community/hooks/useCommunityStats';
import { Button } from '@/shared/ui/Button';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { Loading } from '@/shared/ui/Loading';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';
import { EXTERNAL_LINKS } from '@/shared/constants/externalLinks';
import { getStatusLabel } from '@/shared/utils/reportStatus';

import screen from '@/shared/styles/screen.module.css';
import styles from './CommunityPage.module.css';

export interface CommunityPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommunityPage({ isOpen, onClose }: CommunityPageProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [themeFilter, setThemeFilter] = useState(COMMUNITY_THEME_FILTER_ALL);

  const { stats, isLoading, error, reload } = useCommunityStats({
    enabled: isOpen,
    isAuthenticated,
    themeFilter,
  });

  const headerSubtitle = stats?.communityName || 'Géodésie';

  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose}>
      <PageHeader
        title="Communauté"
        subtitle={headerSubtitle}
        onClose={onClose}
        showCloseButton={false}
        showBackButton
        onBack={onClose}
      />

      <main className={`${screen.screenContainer} ${styles.content}`}>
        {!isAuthenticated ? (
          <section className={styles.loginBanner}>
            <p className="body">
              Les statistiques de signalements sont visibles sans compte. Connectez-vous pour
              la présentation de la communauté et le nombre de membres.
            </p>
            <Button
              type="button"
              fullWidth
              className={styles.actionButton}
              onClick={() => {
                onClose();
                navigate('/login');
              }}
            >
              Se connecter
            </Button>
          </section>
        ) : null}

        {stats?.communityDescriptionHtml ? (
          <div
            className={`body ${styles.descriptionHtml}`}
            dangerouslySetInnerHTML={{ __html: stats.communityDescriptionHtml }}
          />
        ) : null}

        <section className={styles.section} aria-labelledby="community-theme-filter">
          <label className={styles.filterLabel} htmlFor="community-theme-filter">
            Thème des signalements
          </label>
          <select
            id="community-theme-filter"
            className={styles.themeSelect}
            value={themeFilter}
            onChange={(event) => setThemeFilter(event.target.value)}
            disabled={isLoading && !stats}
          >
            <option value={COMMUNITY_THEME_FILTER_ALL}>Tous les thèmes</option>
            {(stats?.themeOptions ?? []).map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </section>

        {error ? (
          <section className={styles.section}>
            <p className={`body ${styles.errorText}`}>{error.message}</p>
            <Button type="button" color="secondary" onClick={reload}>
              Réessayer
            </Button>
          </section>
        ) : null}

        {isLoading && !stats ? (
          <Loading label="Chargement des statistiques…" />
        ) : null}

        {stats ? (
          <>
            <section className={styles.section} aria-labelledby="community-kpi-title">
              <h2 id="community-kpi-title" className={styles.sectionTitle}>
                Vue d&apos;ensemble
              </h2>
              <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiValue}>
                    {isLoading ? '—' : stats.reportsTotal}
                  </span>
                  <span className={styles.kpiLabel}>Signalements</span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiValue}>
                    {isLoading || !isAuthenticated ? '—' : stats.membersCount ?? '—'}
                  </span>
                  <span className={styles.kpiLabel}>Membres</span>
                </div>
              </div>
              {!isAuthenticated && !isLoading ? (
                <p className={`body ${styles.hint}`}>
                  Connectez-vous pour afficher le nombre de membres.
                </p>
              ) : null}
              {isAuthenticated && stats.membersCount === null && !isLoading ? (
                <p className={`body ${styles.hint}`}>
                  Le nombre de membres n&apos;est pas disponible avec votre profil.
                </p>
              ) : null}
            </section>

            <section className={styles.section} aria-labelledby="community-status-title">
              <h2 id="community-status-title" className={styles.sectionTitle}>
                Par statut
              </h2>
              {stats.statusCounts.length === 0 && !isLoading ? (
                <p className="body">Aucun signalement pour ce filtre.</p>
              ) : (
                <ul className={styles.statusList}>
                  {stats.statusCounts.map(({ status, count }) => (
                    <li key={status} className={styles.statusRow}>
                      <span className={styles.statusLabel}>{getStatusLabel(status)}</span>
                      <span className={styles.statusCount}>
                        {isLoading ? '—' : count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}

        <p className={`body ${styles.footerNote}`}>
          Détails et gestion sur{' '}
          <ExternalLink href={EXTERNAL_LINKS.ESPACE_COLLABORATIF}>
            l&apos;Espace collaboratif IGN
          </ExternalLink>
          .
        </p>
      </main>
    </SlideUpPage>
  );
}
