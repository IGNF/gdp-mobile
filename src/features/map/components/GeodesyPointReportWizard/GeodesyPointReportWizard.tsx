import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { GeodesyPointReportMapContext } from '@/domain/report/geodesyPointMapContext';
import { useBottomSheetSnap } from '@/features/map/hooks/useBottomSheetSnap';
import {
  ReportWizardStepConformity,
  ReportWizardStepNonConformReason,
  ReportWizardStepMedia,
  ReportWizardStepSummary,
  WizardStepHeader,
  type NonConformReason,
} from '@/features/report/components/GeodesyPointReportWizard';
import { useGeodesyPointReportForm } from '@/features/report/hooks/useGeodesyPointReportForm';
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
  const [step, setStep] = useState(0);
  const [isConform, setIsConform] = useState(true);
  const [nonConformReason, setNonConformReason] = useState<NonConformReason | null>(null);
  const totalSteps = isConform ? 3 : 4;
  const mediaStep = isConform ? 1 : 2;
  const summaryStep = isConform ? 2 : 3;
  const form = useGeodesyPointReportForm({
    reportContext,
    initialComment: '',
  });

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
      setIsConform(true);
      setNonConformReason(null);
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
          <WizardStepHeader
            pointId={reportContext.geodesyId ?? reportContext.title}
            step={step + 1}
            totalSteps={totalSteps}
          />
        </div>

        <div className={styles.body} data-scroll-root="true">
          {step === 0 ? (
            <ReportWizardStepConformity isConform={isConform} onChange={setIsConform} />
          ) : !isConform && step === 1 ? (
            <ReportWizardStepNonConformReason
              reason={nonConformReason}
              onChange={setNonConformReason}
            />
          ) : step === mediaStep ? (
            <ReportWizardStepMedia form={form} />
          ) : step === summaryStep ? (
            <ReportWizardStepSummary
              isConform={isConform}
              nonConformReason={nonConformReason}
              mediaStep={mediaStep}
              form={form}
              onEditStep={(targetStep) => setStep(targetStep)}
            />
          ) : (
            <p className="debug-banner">DOING — Écran en cours de reconstruction</p>
          )}
        </div>

        <div className={styles.footer}>
          {step === 0 ? (
            <Button type="button" fullWidth onClick={() => setStep(1)}>
              Suivant
            </Button>
          ) : !isConform && step === 1 ? (
            <div className={styles.footerRow}>
              <Button type="button" variant="outline" fullWidth onClick={() => setStep(0)}>
                Retour
              </Button>
              <Button
                type="button"
                fullWidth
                disabled={!nonConformReason}
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
                onClick={() => setStep(isConform ? 0 : 1)}
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
              <Button type="button" fullWidth onClick={() => setStep(summaryStep + 1)}>
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
