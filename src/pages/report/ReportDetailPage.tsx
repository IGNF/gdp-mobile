import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { BottomTabbar } from '@/app/components/BottomTabbar';
import type { LocalReportDraft } from '@/domain/report/localReportDraft';
import { ReportPositionMap } from '@/features/report/components/ReportPositionMap';
import {
  NON_CONFORM_REASON_LABELS,
  type NonConformReason,
} from '@/features/report/components/GeodesyPointReportWizard';
import {
  deleteLocalReportDraft,
  getLocalReportDraft,
} from '@/infra/storage/localReportDraftsStore';
import {
  getLocalReportDraftStatusColors,
  getLocalReportDraftStatusLabel,
} from '@/features/report/utils/localReportDraftStatus';
import { Button } from '@/shared/ui/Button';
import { PageHeader } from '@/shared/ui/PageHeader';
import { joinCSSClassNames } from '@/shared/utils/join';
import IconArticle from '@/shared/assets/icons/icon-article.svg?react';
import IconCamera from '@/shared/assets/icons/icon-camera.svg?react';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconDelete from '@/shared/assets/icons/icon-delete.svg?react';
import IconPencil from '@/shared/assets/icons/icon-pencil.svg?react';
import IconSend from '@/shared/assets/icons/icon-send.svg?react';

import styles from './ReportDetailPage.module.css';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<LocalReportDraft | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setDraft(null);
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

  return (
    <div className={styles.page}>
      <PageHeader
        title="Détail du signalement"
        showBackButton
        showCloseButton={false}
        onBack={() => navigate('/reports')}
      />

      <main className={styles.main}>
        {draft === undefined ? (
          <p className={styles.empty}>Chargement…</p>
        ) : draft === null ? (
          <p className={styles.empty}>Ce signalement est introuvable.</p>
        ) : (
          <>
            <div className={styles.headerRow}>
              <span className={styles.reportId}>ID_{draft.geodesyId ?? draft.title}</span>
              <span
                className={styles.statusBadge}
                style={getLocalReportDraftStatusColors(draft.status)}
              >
                {getLocalReportDraftStatusLabel(draft.status)}
              </span>
            </div>

            <div className={styles.photoCard}>
              {draft.photos[0] ? (
                <img src={draft.photos[0].dataUrl} alt="" className={styles.photoImage} />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <IconCamera className={styles.photoPlaceholderIcon} aria-hidden />
                </div>
              )}
            </div>

            <div className={styles.grid}>
              <div className={styles.card}>
                <p className={styles.cardLabel}>État</p>
                <p className={styles.cardValue}>
                  <span
                    className={joinCSSClassNames(
                      styles.cardValueIcon,
                      draft.isConform ? styles.cardValueIconConform : styles.cardValueIconNonConform,
                    )}
                  >
                    {draft.isConform ? (
                      <IconCheck className={styles.cardValueIconSvg} aria-hidden />
                    ) : (
                      <IconClose className={styles.cardValueIconSvg} aria-hidden />
                    )}
                  </span>
                  {draft.isConform ? 'Conforme' : 'Non conforme'}
                </p>
                <p className={styles.cardDetail}>
                  {draft.isConform
                    ? 'Conforme'
                    : (draft.nonConformReason &&
                        NON_CONFORM_REASON_LABELS[draft.nonConformReason as NonConformReason]) ||
                      '—'}
                </p>
              </div>

              <div className={styles.card}>
                <p className={styles.cardLabel}>Position</p>
                <p className={styles.cardValue}>
                  <span className={joinCSSClassNames(styles.cardValueIcon, styles.cardValueIconConform)}>
                    {draft.positionModified ? (
                      <IconPencil className={styles.cardValueIconSvg} aria-hidden />
                    ) : (
                      <IconCheck className={styles.cardValueIconSvg} aria-hidden />
                    )}
                  </span>
                  {draft.positionModified ? 'Modifiée' : 'Confirmée'}
                </p>
                <p className={styles.cardDetail}>
                  {draft.latitude.toFixed(4)}° N, {draft.longitude.toFixed(4)}° E
                </p>
              </div>
            </div>

            <div className={styles.mapPreview}>
              <ReportPositionMap
                longitude={draft.longitude}
                latitude={draft.latitude}
                onPositionChange={() => {}}
                readOnly
              />
            </div>

            <div className={styles.commentCard}>
              <div className={styles.commentHeader}>
                <span className={styles.commentTitle}>
                  <IconArticle className={styles.commentIcon} aria-hidden />
                  Commentaire
                </span>
              </div>
              <p className={styles.commentBody}>
                {draft.comment.trim() ? draft.comment : 'Aucun commentaire ajouté.'}
              </p>
            </div>

            <div className={styles.actions}>
              <Button
                type="button"
                variant="outline"
                color="danger"
                fullWidth
                onClick={() => {
                  void handleDelete();
                }}
              >
                <IconDelete className={styles.actionIcon} aria-hidden />
                Supprimer
              </Button>
              <Button type="button" fullWidth onClick={() => {}}>
                <IconSend className={styles.actionIcon} aria-hidden />
                Envoyer
              </Button>
            </div>
          </>
        )}
      </main>

      <BottomTabbar activeTab="signalements" />
    </div>
  );
}
