import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLogo } from '@/shared/ui/AppLogo';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { EXTERNAL_LINKS } from '@/shared/constants/externalLinks';
import IconExternalLink from '@/shared/assets/icons/icon-external-link.svg?react';
import { Button } from '@/shared/ui/Button';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { Loading } from '@/shared/ui/Loading';

import styles from './LoginPage.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithOAuth, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialAuthCheckCompleted, setHasInitialAuthCheckCompleted] = useState(
    () => !isAuthLoading,
  );

  useEffect(() => {
    if (!isAuthLoading) {
      setHasInitialAuthCheckCompleted(true);
    }
  }, [isAuthLoading]);

  useEffect(() => {
    if (hasInitialAuthCheckCompleted && isAuthenticated) {
      navigate('/map', { replace: true });
    }
  }, [hasInitialAuthCheckCompleted, isAuthenticated, navigate]);

  if (!hasInitialAuthCheckCompleted || isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={`${styles.content} ${styles.loadingContent}`}>
          <Loading size="large" label="Restauration de la session…" />
        </div>
      </div>
    );
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await loginWithOAuth();

      if (!result.success) {
        if (result.error?.message === 'OAuth redirect') {
          return;
        }
        setError(result.error?.message ?? 'Échec de la connexion');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        
        <header className={styles.header}>
          <AppLogo size="sm" />
          <h1 className={styles.title}>Bienvenue</h1>
          <p className={styles.subtitle}>
            Connectez vous pour accéder à votre espace personnel
          </p>
        </header>

        <form className={styles.form} onSubmit={handleLogin}>
          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" fullWidth loading={isSubmitting} className={styles.actionButton}>
            Se connecter
            {!isSubmitting && (
              <IconExternalLink className={styles.buttonIcon} aria-hidden />
            )}
          </Button>

          <ExternalLink
            href={EXTERNAL_LINKS.ESPACE_COLLABORATIF}
            className={styles.outlineButton}
            showIcon={false}
          >
            Créer un compte
            <IconExternalLink className={styles.buttonIcon} aria-hidden />
          </ExternalLink>

          <ExternalLink
            href={EXTERNAL_LINKS.GEOPF_SSO_RESET_CREDENTIALS}
            className={styles.forgotPasswordLink}
            showIcon={false}
          >
            Mot de passe oublié ?
            <IconExternalLink className={styles.forgotPasswordIcon} aria-hidden />
          </ExternalLink>
        </form>
      </div>
    </div>
  );
}
