import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ONBOARDING_STEPS } from '@/features/welcome/constants/onboardingSteps';
import { useFirstRun } from '@/features/welcome/hooks/useFirstRun';
import { Button } from '@/shared/ui/Button';
import { config } from '@/shared/config/env';

import styles from './WelcomePage.module.css';

export function WelcomePage() {
  const navigate = useNavigate();
  const { isFirstRun, markAsSeen } = useFirstRun();
  const [stepIndex, setStepIndex] = useState(0);
  const nextRoute = config.authRequired ? '/login' : '/map';

  useEffect(() => {
    if (isFirstRun === false) {
      navigate(nextRoute, { replace: true });
    }
  }, [isFirstRun, navigate, nextRoute]);

  if (isFirstRun === false) {
    return null;
  }

  const step = ONBOARDING_STEPS[stepIndex];
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;

  const finish = () => {
    markAsSeen();
    navigate(nextRoute);
  };

  const handleNext = () => {
    if (isLastStep) {
      finish();
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.main} aria-live="polite">
          <img
            src={step.illustration}
            alt=""
            className={styles.illustration}
          />
          <h1 className={styles.title}>{step.title}</h1>
          <p className={styles.description}>{step.description}</p>
        </div>

        <div className={styles.dots} role="tablist" aria-label="Progression">
          {ONBOARDING_STEPS.map((_, index) => (
            <span
              key={index}
              className={`${styles.dot} ${index === stepIndex ? styles.dotActive : ''}`}
              aria-current={index === stepIndex ? 'step' : undefined}
            />
          ))}
        </div>

        <div className={styles.footer}>
          {isLastStep ? (
            <Button fullWidth onClick={finish}>
              Commencer
            </Button>
          ) : (
            <>
              <Button
                className={styles.footerButton}
                variant="outline"
                onClick={finish}
              >
                Ignorer
              </Button>
              <Button className={styles.footerButton} onClick={handleNext}>
                Suivant
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
