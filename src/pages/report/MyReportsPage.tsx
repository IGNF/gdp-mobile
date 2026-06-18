import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import type { GroupReport } from '@/domain/report/groupReportModels';
import { GroupReportRow } from '@/features/report/components/GroupReportRow';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMyReports } from '@/features/report/hooks/useMyReports';
import { Button } from '@/shared/ui/Button';
import { Loading } from '@/shared/ui/Loading';
import { PageHeader } from '@/shared/ui/PageHeader';

import screen from '@/shared/styles/screen.module.css';
import typography from '@/shared/styles/typography.module.css';

import styles from './MyReportsPage.module.css';

interface ReportsLocationState {
  sentReportId?: number;
}

function isReportsLocationState(value: unknown): value is ReportsLocationState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as ReportsLocationState;
  return candidate.sentReportId === undefined || typeof candidate.sentReportId === 'number';
}

export function MyReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = isReportsLocationState(location.state) ? location.state : null;
  const { isAuthenticated } = useAuth();
  const {
    serverReports,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
  } = useMyReports();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (locationState?.sentReportId) {
      setSuccessMessage(`Signalement n°${locationState.sentReportId} envoyé avec succès.`);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, locationState?.sentReportId, navigate]);

  const handleReportSelect = useCallback(
    (report: GroupReport) => {
      if (report.longitude === null || report.latitude === null) {
        return;
      }

      navigate('/map', {
        state: {
          focusReport: {
            id: report.id,
            longitude: report.longitude,
            latitude: report.latitude,
          },
        },
      });
    },
    [navigate],
  );

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className={styles.empty}>
          <p>Connectez-vous pour consulter vos signalements envoyés.</p>
          <Button type="button" onClick={() => navigate('/login')}>
            Se connecter
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className={styles.loading}>
          <Loading label="Chargement de vos signalements…" />
        </div>
      );
    }

    if (error && serverReports.length === 0) {
      return <p className={styles.error}>{error}</p>;
    }

    if (serverReports.length === 0) {
      return (
        <p className={styles.empty}>
          Aucun signalement repère pour le moment. Touchez un repère sur la carte pour en créer
          un.
        </p>
      );
    }

    return (
      <section className={styles.section}>
        {error ? <p className={styles.error}>{error}</p> : null}
        <p className={styles.count}>
          <strong>
            {serverReports.length} signalement{serverReports.length > 1 ? 's' : ''}
          </strong>
          {!hasMore ? ' (liste complète)' : null}
        </p>
        <div className={styles.reportList}>
          {serverReports.map((report) => (
            <GroupReportRow
              key={report.id}
              report={report}
              onSelect={handleReportSelect}
            />
          ))}
        </div>
        {hasMore ? (
          <Button
            type="button"
            variant="outline"
            fullWidth
            loading={isLoadingMore}
            onClick={() => void loadMore()}
          >
            Charger plus
          </Button>
        ) : (
          <p className={styles.endOfList}>Fin de la liste</p>
        )}
      </section>
    );
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Signalements"
        subtitle="Mes signalements"
        showBackButton
        showCloseButton={false}
        onBack={() => navigate('/map')}
      />

      <main className={`${styles.main} ${screen.screenContainer}`}>
        <div className={styles.titleSection}>
          <h1 className={typography.title}>Mes signalements</h1>
          <p className={typography.subtitle}>
            Signalements repère géodésique envoyés vers l&apos;Espace collaboratif.
          </p>
        </div>

        {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}

        {renderContent()}

        <div className={styles.actions}>
          <Button type="button" fullWidth onClick={() => navigate('/map')}>
            Retour à la carte
          </Button>
        </div>
      </main>
    </div>
  );
}
