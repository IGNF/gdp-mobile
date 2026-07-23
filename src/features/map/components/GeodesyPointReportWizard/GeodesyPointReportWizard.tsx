import { withGeodesyPointReportPosition } from '@ign/gdp-tools';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { GeodesyPointReportMapContext } from '@/domain/report/geodesyPointMapContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBottomSheetSnap } from '@/features/map/hooks/useBottomSheetSnap';
import {
  ReportWizardStepConfirmation,
  ReportWizardStepMedia,
  ReportWizardStepPoint,
  ReportWizardStepSummary,
  WizardStepHeader,
} from '@/features/report/components/GeodesyPointReportWizard';
import { useGeodesyPointReportForm } from '@/features/report/hooks/useGeodesyPointReportForm';
import { useSubmitGeodesyPointReport } from '@/features/report/hooks/useSubmitGeodesyPointReport';
import { Button } from '@/shared/ui/Button';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';

import styles from './GeodesyPointReportWizard.module.css';

const TOTAL_STEPS = 4;

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

  return [Math.min(Math.round(viewportHeight * 0.62), maxHeight), maxHeight];
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
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useGeodesyPointReportForm({
    reportContext,
    initialComment: reportContext.comment ?? '',
  });
  const { submitGeodesyPointReport, isSubmitting, error: submitError, clearError } =
    useSubmitGeodesyPointReport();

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
      setSuccessMessage(null);
      clearError();
    }
  }, [clearError, isOpen]);

  const handleSubmitReport = useCallback(async () => {
    clearError();

    if (!isAuthenticated || !form.validate()) {
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
      setSuccessMessage(
        `Signalement n°${result.serverId} envoyé. Retrouvez-le dans la page « Mes signalements ».`,
      );
      setStep(3);
    }
  }, [clearError, form, isAuthenticated, reportContext, submitGeodesyPointReport]);

  const handleNextFromPoint = () => {
    if (form.validateThemeAttributes()) {
      setStep(1);
    }
  };

  const handleNextFromMedia = () => {
    if (form.validatePhoto()) {
      setStep(2);
    }
  };

  const footer =
    step === 0 ? (
      <Button type="button" fullWidth onClick={handleNextFromPoint}>
        Suivant
      </Button>
    ) : step === 1 ? (
      <div className={styles.footerRow}>
        <Button type="button" variant="outline" fullWidth onClick={() => setStep(0)}>
          Retour
        </Button>
        <Button type="button" fullWidth onClick={handleNextFromMedia}>
          Suivant
        </Button>
      </div>
    ) : step === 2 ? (
      <div className={styles.footerRow}>
        <Button type="button" variant="outline" fullWidth onClick={() => setStep(1)}>
          Retour
        </Button>
        <Button
          type="button"
          fullWidth
          loading={isSubmitting}
          disabled={!isAuthenticated}
          onClick={() => void handleSubmitReport()}
        >
          Envoyer
        </Button>
      </div>
    ) : null;

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
          <div className={styles.handleArea} aria-hidden>
            <span className={styles.handle} />
          </div>
          {step < 3 ? (
            <div className={styles.headerRow}>
              <WizardStepHeader pointId={reportContext.title} step={step + 1} totalSteps={TOTAL_STEPS} />
              <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">
                <IconClose className={styles.closeIcon} aria-hidden />
              </button>
            </div>
          ) : (
            <button type="button" className={styles.closeButtonAlone} onClick={onClose} aria-label="Fermer">
              <IconClose className={styles.closeIcon} aria-hidden />
            </button>
          )}
        </div>

        <div className={styles.body} data-scroll-root="true">
          {step === 0 ? <ReportWizardStepPoint reportContext={reportContext} form={form} /> : null}
          {step === 1 ? <ReportWizardStepMedia form={form} /> : null}
          {step === 2 ? (
            <>
              <ReportWizardStepSummary
                reportContext={reportContext}
                form={form}
                onEditStep={(targetStep) => setStep(targetStep - 1)}
              />
              {!isAuthenticated ? (
                <p className={styles.authHint}>Connexion requise pour l’envoi vers le serveur.</p>
              ) : null}
              {submitError ? <p className={styles.errorText}>{submitError.message}</p> : null}
            </>
          ) : null}
          {step === 3 ? (
            <ReportWizardStepConfirmation
              message={successMessage ?? 'Signalement envoyé.'}
              onReturnToMap={onClose}
            />
          ) : null}
        </div>

        {footer ? <div className={styles.footer}>{footer}</div> : null}
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
