import { withGeodesyPointReportPosition } from '@ign/gdp-tools';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import {
  isGeodesyPointReportMapContext,
  type GeodesyPointReportMapContext,
} from '@/domain/report/geodesyPointMapContext';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { GeodesyPointReportForm } from '@/features/report/components/GeodesyPointReportForm';
import { useGeodesyPointReportForm } from '@/features/report/hooks/useGeodesyPointReportForm';
import { useSubmitGeodesyPointReport } from '@/features/report/hooks/useSubmitGeodesyPointReport';
import { Button } from '@/shared/ui/Button';
import { PageHeader } from '@/shared/ui/PageHeader';

import screen from '@/shared/styles/screen.module.css';
import typography from '@/shared/styles/typography.module.css';

import styles from './CreateGeodesyPointReportPage.module.css';

interface CreateGeodesyPointReportContentProps {
  mapContext: GeodesyPointReportMapContext;
}

function CreateGeodesyPointReportContent({ mapContext }: CreateGeodesyPointReportContentProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { reportContext } = mapContext;
  const form = useGeodesyPointReportForm({
    reportContext,
    initialComment: reportContext.comment ?? '',
  });
  const { submitGeodesyPointReport, isSubmitting, clearError } = useSubmitGeodesyPointReport();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);
    clearError();

    if (!isAuthenticated) {
      setSubmitError('Connectez-vous pour envoyer un signalement.');
      return;
    }

    if (!form.validate()) {
      return;
    }

    const contextForSubmit = form.canEditPosition
      ? withGeodesyPointReportPosition(reportContext, {
          longitude: form.longitude,
          latitude: form.latitude,
        })
      : reportContext;

    const result = await submitGeodesyPointReport(
      contextForSubmit,
      form.comment,
      form.photos,
      form.normalizedThemeAttributes,
    );

    if (result?.serverId) {
      setSuccessMessage(`Signalement n°${result.serverId} envoyé.`);
      window.setTimeout(() => {
        navigate('/map');
      }, 1200);
    }
  };

  return (
    <>
      <PageHeader
        title="Signalement géodésie"
        showBackButton
        onBack={() => navigate('/map')}
      />

      <main className={`${styles.main} ${screen.screenContainer}`}>
        <div className={styles.titleSection}>
          <h1 className={typography.title}>Signalement sur point</h1>
          <p className={typography.subtitle}>
            Décrivez l&apos;état du point et joignez des photos de terrain.
          </p>
        </div>

        <form className={styles.formShell} onSubmit={(event) => void handleSubmit(event)}>
          <GeodesyPointReportForm reportContext={reportContext} form={form} />

          <div className={styles.actions}>
            {successMessage ? <p className={styles.success}>{successMessage}</p> : null}
            {submitError ? <p className={styles.error}>{submitError}</p> : null}

            <Button
              type="submit"
              fullWidth
              disabled={isSubmitting || !isAuthenticated}
              loading={isSubmitting}
            >
              Envoyer le signalement
            </Button>
            {!isAuthenticated ? (
              <p className={styles.authHint}>Connexion requise pour l&apos;envoi vers le serveur.</p>
            ) : null}
          </div>
        </form>
      </main>
    </>
  );
}

export function CreateGeodesyPointReportPage() {
  const location = useLocation();
  const mapContext = isGeodesyPointReportMapContext(location.state) ? location.state : null;

  if (!mapContext) {
    return <Navigate to="/map" replace />;
  }

  return (
    <div className={styles.page}>
      <CreateGeodesyPointReportContent mapContext={mapContext} />
    </div>
  );
}
