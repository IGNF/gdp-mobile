import { useState, type ChangeEvent } from 'react';
import { isGeodesyPointReportPositionEditable } from '@ign/gdp-tools';
import { GeodesyPointTitle } from '@ign/gdp-tools/react';
import { RiMap2Line } from 'react-icons/ri';

import type { LocalReportDraft } from '@/domain/report/localReportDraft';
import { resolvePointVariantFromReportContext } from '@/features/map/components/MapBottomSheet/pointFiche/resolvePointFicheVariant';
import {
  ReportWizardStepConformity,
  ReportWizardStepNonConformReason,
  type NonConformReason,
} from '@/features/report/components/GeodesyPointReportWizard';
import { ReportPositionMap } from '@/features/report/components/ReportPositionMap';
import { compressPhotoFile } from '@/features/report/utils/compressPhoto';
import {
  getDraftOriginalPosition,
  getDraftUserComment,
  updateDraftComment,
  updateDraftConformity,
  updateDraftPhoto,
  updateDraftPosition,
} from '@/features/report/utils/editLocalReportDraft';
import { fileToDataUrl } from '@/features/report/utils/localReportDraft';
import { buildGeodesyPointReportContextFromDraft } from '@/features/report/utils/rebuildGeodesyPointReportFromDraft';
import { validatePhotoLandscape } from '@/features/report/utils/validatePhotoLandscape';
import { Button } from '@/shared/ui/Button';
import { Loading } from '@/shared/ui/Loading';
import { formatDate } from '@/shared/utils/date';
import { joinCSSClassNames } from '@/shared/utils/join';
import IconCamera from '@/shared/assets/icons/icon-camera.svg?react';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconPencil from '@/shared/assets/icons/icon-pencil.svg?react';

import styles from './ReportDetailPage.module.css';
import type { ReportDetailView } from './reportDetailView';

type EditableField = 'conformity' | 'photo' | 'position' | 'comment';

export interface ReportDetailContentProps {
  report: ReportDetailView;
  onViewOnMap: () => void;
  /** Brouillon non envoyé : ses champs se modifient un à un, sur place. */
  editableDraft?: LocalReportDraft;
  onDraftChange?: (draft: LocalReportDraft) => Promise<void>;
}

interface EditButtonProps {
  label: string;
  className?: string;
  onClick: () => void;
}

function EditButton({ label, className, onClick }: EditButtonProps) {
  return (
    <button
      type="button"
      className={joinCSSClassNames(styles.editButton, className)}
      onClick={onClick}
      aria-label={label}
    >
      <IconPencil className={styles.editIcon} aria-hidden />
    </button>
  );
}

interface EditActionsProps {
  canSave?: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

function EditActions({ canSave = true, isSaving, onCancel, onSave }: EditActionsProps) {
  return (
    <div className={styles.editActions}>
      <Button type="button" variant="outline" fullWidth onClick={onCancel} disabled={isSaving}>
        Annuler
      </Button>
      <Button type="button" fullWidth onClick={onSave} disabled={!canSave} loading={isSaving}>
        Enregistrer
      </Button>
    </div>
  );
}

/** Fiche détail d'un signalement — même présentation pour les brouillons locaux et les signalements envoyés. */
export function ReportDetailContent({
  report,
  onViewOnMap,
  editableDraft,
  onDraftChange,
}: ReportDetailContentProps) {
  const hasPosition = report.longitude !== null && report.latitude !== null;
  const canEdit = Boolean(editableDraft && onDraftChange);
  const draftReportContext = editableDraft ? buildGeodesyPointReportContextFromDraft(editableDraft) : null;
  const canEditPosition = Boolean(draftReportContext && isGeodesyPointReportPositionEditable(draftReportContext));

  // Un seul champ en cours de modification à la fois ; valeurs saisies non enregistrées.
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConformInput, setIsConformInput] = useState(true);
  const [reasonsInput, setReasonsInput] = useState<NonConformReason[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [positionInput, setPositionInput] = useState({ longitude: 0, latitude: 0 });
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const startEditing = (field: EditableField) => {
    if (!editableDraft) {
      return;
    }

    setIsConformInput(editableDraft.isConform);
    setReasonsInput((editableDraft.nonConformReasons ?? []) as NonConformReason[]);
    setCommentInput(getDraftUserComment(editableDraft));
    setPositionInput({ longitude: editableDraft.longitude, latitude: editableDraft.latitude });
    setEditingField(field);
  };

  const save = async (buildUpdated: (draft: LocalReportDraft) => LocalReportDraft) => {
    if (!editableDraft || !onDraftChange) {
      return;
    }

    setIsSaving(true);
    try {
      await onDraftChange(buildUpdated(editableDraft));
      setEditingField(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !editableDraft || !onDraftChange) {
      return;
    }

    setPhotoError(null);
    setIsPhotoProcessing(true);
    void (async () => {
      try {
        // Mêmes contrôles que l'étape photo du formulaire : paysage obligatoire, puis compression.
        const landscapeResult = await validatePhotoLandscape(file);
        if (!landscapeResult.valid) {
          setPhotoError(landscapeResult.message);
          return;
        }

        const dataUrl = await fileToDataUrl(await compressPhotoFile(file));
        await onDraftChange(updateDraftPhoto(editableDraft, 'photo1', dataUrl));
      } finally {
        setIsPhotoProcessing(false);
      }
    })();
  };

  const originalPosition = editableDraft ? getDraftOriginalPosition(editableDraft) : null;
  const showEditButton = (field: EditableField) => canEdit && editingField === null && (field !== 'position' || canEditPosition);

  return (
    <>
      <div className={styles.headerRow}>
        <GeodesyPointTitle title={report.title} picto={report.titlePicto} className={styles.reportId} />
        <span className={styles.statusBadge} style={report.statusColors}>
          {report.statusLabel}
        </span>
      </div>

      <div className={styles.photoCard}>
        {isPhotoProcessing ? (
          <div className={styles.photoPlaceholder}>
            <Loading size="small" label="Compression de la photo…" />
          </div>
        ) : report.photoUrl ? (
          <img src={report.photoUrl} alt="" className={styles.photoImage} />
        ) : (
          <div className={styles.photoPlaceholder}>
            <IconCamera className={styles.photoPlaceholderIcon} aria-hidden />
          </div>
        )}
        {showEditButton('photo') && !isPhotoProcessing ? (
          // Le crayon ouvre directement le sélecteur (appareil photo ou galerie selon l'appareil).
          <label className={joinCSSClassNames(styles.editButton, styles.editButtonOverlay)} aria-label="Modifier la photo">
            <input type="file" accept="image/*" className={styles.photoInput} onChange={handlePhotoChange} />
            <IconPencil className={styles.editIcon} aria-hidden />
          </label>
        ) : null}
      </div>
      {photoError ? <p className={styles.editError}>{photoError}</p> : null}

      <div className={styles.grid}>
        <div className={styles.gridRow}>
          {editingField === 'conformity' && draftReportContext ? (
            <div className={joinCSSClassNames(styles.card, styles.cardEditing)}>
              <ReportWizardStepConformity isConform={isConformInput} onChange={setIsConformInput} />
              {isConformInput ? null : (
                <ReportWizardStepNonConformReason
                  reasons={reasonsInput}
                  onChange={setReasonsInput}
                  allowPositionReason={resolvePointVariantFromReportContext(draftReportContext) === 'nivellement'}
                />
              )}
              <EditActions
                canSave={isConformInput || reasonsInput.length > 0}
                isSaving={isSaving}
                onCancel={() => setEditingField(null)}
                onSave={() => void save((draft) => updateDraftConformity(draft, isConformInput, reasonsInput))}
              />
            </div>
          ) : (
            <div
              className={joinCSSClassNames(
                styles.card,
                styles.cardTop,
                showEditButton('conformity') && styles.cardWithEditButton,
              )}
            >
              <p className={styles.cardLabel}>État signalé</p>
              <p className={styles.cardValue}>
                <span
                  className={joinCSSClassNames(
                    styles.cardValueIcon,
                    report.isConform ? styles.cardValueIconConform : styles.cardValueIconNonConform,
                  )}
                >
                  {report.isConform ? (
                    <IconCheck className={styles.cardValueIconSvg} aria-hidden />
                  ) : (
                    <IconClose className={styles.cardValueIconSvg} aria-hidden />
                  )}
                </span>
                {report.isConform ? 'Conforme' : 'Non conforme'}
              </p>
              {showEditButton('conformity') ? (
                <EditButton
                  label="Modifier l'état signalé"
                  className={styles.editButtonCorner}
                  onClick={() => startEditing('conformity')}
                />
              ) : null}
            </div>
          )}

          <div className={joinCSSClassNames(styles.card, styles.cardTop)}>
            <p className={styles.cardLabel}>Date</p>
            <p className={styles.cardValue}>{formatDate(report.createdAt)}</p>
          </div>
        </div>

        <div className={joinCSSClassNames(styles.card, styles.cardBottom)}>
          <p className={styles.cardLabel}>Position</p>
          <p className={styles.cardValue}>{report.address ?? '—'}</p>
        </div>
      </div>

      {editingField === 'position' ? (
        <div className={styles.mapEditor}>
          <div className={styles.mapPreview}>
            <ReportPositionMap
              longitude={positionInput.longitude}
              latitude={positionInput.latitude}
              initialLongitude={originalPosition?.longitude}
              initialLatitude={originalPosition?.latitude}
              canResetPosition={
                originalPosition !== null &&
                (originalPosition.longitude !== positionInput.longitude ||
                  originalPosition.latitude !== positionInput.latitude)
              }
              onPositionChange={setPositionInput}
              onResetPosition={() => {
                if (originalPosition) {
                  setPositionInput(originalPosition);
                }
              }}
              showLayerSwitcher
              showFullscreenButton
            />
          </div>
          <EditActions
            isSaving={isSaving}
            onCancel={() => setEditingField(null)}
            onSave={() => void save((draft) => updateDraftPosition(draft, positionInput))}
          />
        </div>
      ) : hasPosition ? (
        <div className={styles.mapPreview}>
          <ReportPositionMap
            longitude={report.longitude}
            latitude={report.latitude}
            onPositionChange={() => {}}
            readOnly
            showLayerSwitcher
            showFullscreenButton
          />
          {showEditButton('position') ? (
            // En bas à gauche : le coin haut droit porte le bouton plein écran, le bas droit « Voir sur la carte ».
            <EditButton
              label="Modifier la position"
              className={joinCSSClassNames(styles.editButtonOverlay, styles.editButtonMap)}
              onClick={() => startEditing('position')}
            />
          ) : null}
          <button type="button" className={styles.viewOnMap} onClick={onViewOnMap}>
            <RiMap2Line className={styles.actionIcon} aria-hidden />
            Voir sur la carte
          </button>
        </div>
      ) : null}

      <div
        className={joinCSSClassNames(
          styles.commentCard,
          showEditButton('comment') && styles.cardWithEditButton,
        )}
      >
        <p className={styles.cardLabel}>Commentaire</p>
        {showEditButton('comment') ? (
          <EditButton
            label="Modifier le commentaire"
            className={styles.editButtonCorner}
            onClick={() => startEditing('comment')}
          />
        ) : null}
        {editingField === 'comment' ? (
          <>
            <textarea
              className={styles.commentInput}
              placeholder="Décrivez ce que vous avez observé…"
              value={commentInput}
              onChange={(event) => setCommentInput(event.target.value)}
              rows={3}
              autoFocus
            />
            <EditActions
              isSaving={isSaving}
              onCancel={() => setEditingField(null)}
              onSave={() => void save((draft) => updateDraftComment(draft, commentInput))}
            />
          </>
        ) : (
          <p className={styles.commentBody}>
            {report.comment.trim() ? report.comment : 'Aucun commentaire ajouté.'}
          </p>
        )}
      </div>
    </>
  );
}
