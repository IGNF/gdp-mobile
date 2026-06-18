import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useFirstRun } from '@/features/welcome/hooks/useFirstRun';
import { AppLogo } from '@/shared/ui/AppLogo';
import { Button } from '@/shared/ui/Button';
import { config } from '@/shared/config/env';

import screen from '@/shared/styles/screen.module.css';
import typography from '@/shared/styles/typography.module.css';

import styles from './WelcomePage.module.css';

export function WelcomePage() {
  const navigate = useNavigate();
  const { isFirstRun, markAsSeen } = useFirstRun();
  const nextRoute = config.authRequired ? '/login' : '/map';

  useEffect(() => {
    if (isFirstRun === false) {
      navigate(nextRoute, { replace: true });
    }
  }, [isFirstRun, navigate, nextRoute]);

  if (isFirstRun === false) {
    return null;
  }

  const handleContinue = () => {
    markAsSeen();
    navigate(nextRoute);
  };

  return (
    <div className={`${styles.container} ${screen.screenContainer}`}>
      <div className={styles.content}>
        <AppLogo size="lg" />
        <h1 className={typography.title}>Bienvenue</h1>
        <h2 className={typography.subtitle}>Géodésie de poche</h2>

        <p className={typography.paragraph}>
          Consultez les repères géodésiques et signalez leur état
          <br />
          sur le terrain.
        </p>

        <Button onClick={handleContinue} fullWidth>
          Continuer
        </Button>
      </div>
    </div>
  );
}
