import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { BottomTabbar } from '@/app/components/BottomTabbar';
import type { LocalReportDraft } from '@/domain/report/localReportDraft';
import type { NonConformReason } from '@/features/report/components/GeodesyPointReportWizard';
import { useSubmitGeodesyPointReport } from '@/features/report/hooks/useSubmitGeodesyPointReport';
import {
  buildGdpWizardThemeFormAttributes,
} from '@/features/report/utils/gdpWizardThemeAttributes';
import {
  buildGeodesyPointReportContextFromDraft,
  buildReportPhotosFromDraft,
} from '@/features/report/utils/rebuildGeodesyPointReportFromDraft';
import {
  deleteLocalReportDraft,
  getLocalReportDraft,
  saveLocalReportDraft,
} from '@/infra/storage/localReportDraftsStore';
import { Button } from '@/shared/ui/Button';
import { PageHeader } from '@/shared/ui/PageHeader';
import IconDelete from '@/shared/assets/icons/icon-delete.svg?react';
import IconSend from '@/shared/assets/icons/icon-send.svg?react';

import { ReportDetailContent } from './ReportDetailContent';
import { buildReportDetailViewFromDraft } from './reportDetailView';
import styles from './ReportDetailPage.module.css';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const cameFromMap = (location.state as { from?: string } | null)?.from === 'map';
  const [draft, setDraft] = useState<LocalReportDraft | null | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { submitGeodesyPointReport, isSubmitting } = useSubmitGeodesyPointReport();

  // Identifiant absent : introuvable, pendant le rendu plutôt que dans l'effet ci-dessous
  // (qui n'a alors plus qu'à charger le brouillon, une vraie resynchronisation avec le
  // stockage local).
  if (!id && draft !== null) {
    setDraft(null);
  }

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;
    void getLocalReportDraft(id).then((result) => {
      if (!cancelled) {
        setDraft(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!id) {
      return;
    }
    await deleteLocalReportDraft(id);
    navigate('/reports');
  };

  const handleSend = async () => {
    if (!draft || draft.serverId || isSubmitting) {
      return;
    }

    setSubmitError(null);
    const reportContext = buildGeodesyPointReportContextFromDraft(draft);
    const photos = buildReportPhotosFromDraft(draft);
    const formThemeAttributes = {
      ...(draft.themeAttributes ??
        buildGdpWizardThemeFormAttributes({
          isConform: draft.isConform,
          nonConformReasons: (draft.nonConformReasons ?? []) as NonConformReason[],
          positionModified: draft.positionModified,
        })),
      move: draft.positionModified ? 'true' : 'false',
    };

    let lastError: string | null = null;
    const result = await submitGeodesyPointReport(
      reportContext,
      draft.comment,
      photos,
      formThemeAttributes,
      {
        onError: (error) => {
          lastError = error.message;
        },
      },
    );

    if (result) {
      const updated = { ...draft, serverId: result.serverId };
      await saveLocalReportDraft(updated);
      setDraft(updated);
    }

    if (result && !lastError) {
      return;
    }

    setSubmitError(lastError ?? 'Impossible d’envoyer le signalement pour le moment.');
  };

  const handleViewOnMap = () => {
    if (!draft) {
      return;
    }

    navigate('/map', {
      state: {
        openReportPoint: {
          longitude: draft.longitude,
          latitude: draft.latitude,
        },
      },
    });
  };

  const handleBack = () => {
    if (cameFromMap && draft) {
      navigate('/map', {
        state: { focusReport: { longitude: draft.longitude, latitude: draft.latitude } },
      });
      return;
    }

    navigate('/reports');
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Détail du signalement"
        showBackButton
        showCloseButton={false}
        onBack={handleBack}
      />

      <main className={styles.main}>
        {draft === undefined ? (
          <p className={styles.empty}>Chargement…</p>
        ) : draft === null ? (
          <p className={styles.empty}>Ce signalement est introuvable.</p>
        ) : (
          <ReportDetailContent
            report={buildReportDetailViewFromDraft(draft)}
            onViewOnMap={handleViewOnMap}
          />
        )}
      </main>

      {draft ? (
        <div className={styles.footer}>
          {submitError ? <p className={styles.submitError}>{submitError}</p> : null}
          <Button
            type="button"
            variant="outline"
            color="danger"
            fullWidth
            className={styles.footerButton}
            onClick={() => {
              void handleDelete();
            }}
          >
            <IconDelete className={styles.footerButtonIcon} aria-hidden />
            Supprimer
          </Button>
          <Button
            type="button"
            fullWidth
            className={styles.footerButton}
            loading={isSubmitting}
            disabled={Boolean(draft.serverId)}
            onClick={() => {
              void handleSend();
            }}
          >
            <IconSend className={styles.footerButtonIcon} aria-hidden />
            {draft.serverId ? 'Envoyé' : 'Envoyer'}
          </Button>
        </div>
      ) : null}

      <BottomTabbar activeTab="signalements" />
    </div>
  );
}
