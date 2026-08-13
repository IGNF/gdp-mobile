import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import type { GeodesyPointReportMapContext } from '@/domain/report/geodesyPointMapContext';
import { useBottomSheetSnap } from '@/features/map/hooks/useBottomSheetSnap';
import {
  ReportWizardStepConformity,
  ReportWizardStepNonConformReason,
  ReportWizardStepMedia,
  ReportWizardStepSummary,
  ReportWizardStepConfirmation,
  WizardStepHeader,
  type NonConformReason,
} from '@/features/report/components/GeodesyPointReportWizard';
import { useGeodesyPointReportForm } from '@/features/report/hooks/useGeodesyPointReportForm';
import { buildLocalReportDraft } from '@/features/report/utils/localReportDraft';
import { saveLocalReportDraft } from '@/infra/storage/localReportDraftsStore';
import { Button } from '@/shared/ui/Button';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';

import styles from './GeodesyPointReportWizard.module.css';

function getSafeAreaTopPx(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  const parsed = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--safe-top'),
  );
  return Number.isFinite(parsed) ? parsed : 0;
}

function getWizardSnapHeights(viewportHeight: number, safeAreaTop: number): readonly number[] {
  const maxHeight = Math.max(360, viewportHeight - Math.max(12, safeAreaTop));

  return [
    Math.min(Math.round(viewportHeight * 0.62), maxHeight),
    Math.min(Math.round(viewportHeight * 0.8), maxHeight),
    maxHeight,
  ];
}

export interface GeodesyPointReportWizardProps {
  isOpen: boolean;
  context: GeodesyPointReportMapContext | null;
  onClose: () => void;
}

interface GeodesyPointReportWizardContentProps {
  isOpen: boolean;
  context: GeodesyPointReportMapContext;
  onClose: () => void;
}

function GeodesyPointReportWizardContent({ isOpen, context, onClose }: GeodesyPointReportWizardContentProps) {
  const { reportContext } = context;
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isConform, setIsConform] = useState<boolean | null>(null);
  const [nonConformReasons, setNonConformReasons] = useState<NonConformReason[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const totalSteps = isConform === false ? 4 : 3;
  const mediaStep = isConform === false ? 2 : 1;
  const summaryStep = isConform === false ? 3 : 2;
  const confirmationStep = summaryStep + 1;
  const form = useGeodesyPointReportForm({
    reportContext,
    initialComment: '',
  });

  const handleSaveDraftAndContinue = useCallback(async () => {
    if (isSavingDraft) {
      return;
    }

    setIsSavingDraft(true);
    try {
      const draft = await buildLocalReportDraft({
        reportContext,
        isConform: isConform === true,
        nonConformReasons,
        comment: form.comment,
        longitude: form.longitude,
        latitude: form.latitude,
        positionModified: form.canResetPosition,
        photos: form.photos,
      });
      await saveLocalReportDraft(draft);
      setStep(confirmationStep);
    } finally {
      setIsSavingDraft(false);
    }
  }, [
    confirmationStep,
    form.canResetPosition,
    form.comment,
    form.latitude,
    form.longitude,
    form.photos,
    isConform,
    isSavingDraft,
    nonConformReasons,
    reportContext,
  ]);

  const handleCloseAndViewReports = useCallback(() => {
    onClose();
    navigate('/reports');
  }, [navigate, onClose]);

  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);
  const [safeAreaTop, setSafeAreaTop] = useState(() => getSafeAreaTopPx());
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      setSafeAreaTop(getSafeAreaTopPx());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const snapHeights = useMemo(
    () => getWizardSnapHeights(viewportHeight, safeAreaTop),
    [viewportHeight, safeAreaTop],
  );

  const { currentHeight, dragHandleProps } = useBottomSheetSnap({
    snapHeights,
    initialIndex: 0,
    enabled: isOpen,
  });

  if (isOpen && !shouldRender) {
    setShouldRender(true);
  }
  if (!isOpen && isVisible) {
    setIsVisible(false);
  }

  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => setIsVisible(true), 20);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => setShouldRender(false), 300);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setIsConform(null);
      setNonConformReasons([]);
    }
  }, [isOpen]);

  if (!shouldRender) {
    return null;
  }

  const content = (
    <>
      <button
        type="button"
        className={`${styles.backdrop} ${isVisible ? styles.backdropVisible : ''}`}
        onClick={onClose}
        aria-label="Fermer"
      />
      <section
        ref={sheetRef}
        className={`${styles.sheet} ${isVisible ? styles.sheetVisible : ''}`}
        style={{ height: `${currentHeight}px` }}
        role="dialog"
        aria-modal="true"
        aria-label="Signaler un point"
      >
        <div className={styles.dragZone} {...dragHandleProps}>
          <div className={styles.handleRow}>
            <div className={styles.handleSpacer} aria-hidden />
            <div className={styles.handleArea} aria-hidden>
              <span className={styles.handle} />
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              onPointerDown={(event) => event.stopPropagation()}
              aria-label="Fermer"
            >
              <IconClose className={styles.closeIcon} aria-hidden />
            </button>
          </div>
          {step === confirmationStep ? null : (
            <WizardStepHeader
              pointId={reportContext.geodesyId ?? reportContext.title}
              step={step + 1}
              totalSteps={totalSteps}
            />
          )}
        </div>

        <div className={styles.body} data-scroll-root="true">
          {step === 0 ? (
            <ReportWizardStepConformity isConform={isConform} onChange={setIsConform} />
          ) : isConform === false && step === 1 ? (
            <ReportWizardStepNonConformReason
              reasons={nonConformReasons}
              onChange={setNonConformReasons}
            />
          ) : step === mediaStep ? (
            <ReportWizardStepMedia form={form} />
          ) : step === summaryStep ? (
            <ReportWizardStepSummary
              isConform={isConform === true}
              nonConformReasons={nonConformReasons}
              mediaStep={mediaStep}
              form={form}
              onEditStep={(targetStep) => setStep(targetStep)}
            />
          ) : step === confirmationStep ? (
            <ReportWizardStepConfirmation
              onSendLater={handleCloseAndViewReports}
              onSendNow={handleCloseAndViewReports}
            />
          ) : (
            <p className="debug-banner">DOING — Écran en cours de reconstruction</p>
          )}
        </div>

        <div className={styles.footer} hidden={step === confirmationStep}>
          {step === 0 ? (
            <Button type="button" fullWidth disabled={isConform === null} onClick={() => setStep(1)}>
              Suivant
            </Button>
          ) : isConform === false && step === 1 ? (
            <div className={styles.footerRow}>
              <Button type="button" variant="outline" fullWidth onClick={() => setStep(0)}>
                Retour
              </Button>
              <Button
                type="button"
                fullWidth
                disabled={nonConformReasons.length === 0}
                onClick={() => setStep(mediaStep)}
              >
                Suivant
              </Button>
            </div>
          ) : step === mediaStep ? (
            <div className={styles.footerRow}>
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setStep(isConform === false ? 1 : 0)}
              >
                Retour
              </Button>
              <Button
                type="button"
                fullWidth
                onClick={() => {
                  if (form.validatePhoto()) {
                    setStep(summaryStep);
                  }
                }}
              >
                Suivant
              </Button>
            </div>
          ) : step === summaryStep ? (
            <div className={styles.footerRow}>
              <Button type="button" variant="outline" fullWidth onClick={() => setStep(mediaStep)}>
                Retour
              </Button>
              <Button
                type="button"
                fullWidth
                loading={isSavingDraft}
                onClick={() => {
                  void handleSaveDraftAndContinue();
                }}
              >
                Suivant
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );

  return createPortal(content, document.body);
}

export function GeodesyPointReportWizard({ isOpen, context, onClose }: GeodesyPointReportWizardProps) {
  const [stickyContext, setStickyContext] = useState<GeodesyPointReportMapContext | null>(context);

  useEffect(() => {
    if (context) {
      setStickyContext(context);
    }
  }, [context]);

  if (!stickyContext) {
    return null;
  }

  return (
    <GeodesyPointReportWizardContent
      key={stickyContext.reportContext.geodesyId ?? stickyContext.reportContext.title}
      isOpen={isOpen}
      context={stickyContext}
      onClose={onClose}
    />
  );
}
