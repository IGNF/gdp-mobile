import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { AppLogo } from '@/shared/ui/AppLogo';
import { Button } from '@/shared/ui/Button';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { Loading } from '@/shared/ui/Loading';
import { EXTERNAL_LINKS } from '@/shared/constants/externalLinks';

import screen from '@/shared/styles/screen.module.css';
import typography from '@/shared/styles/typography.module.css';

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
      <div className={`${styles.container} ${screen.screenContainer}`}>
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
    <div className={`${styles.container} ${screen.screenContainer}`}>
      <div className={styles.content}>
        <AppLogo size="md" />
        <h1 className={typography.title}>Connexion</h1>
        <h2 className={typography.subtitle}>Accédez à votre espace collaboratif</h2>

        <p className={`${typography.paragraph} ${typography.italic} ${styles.register}`}>
          Pas encore de compte ?{' '}
          <ExternalLink href={EXTERNAL_LINKS.ESPACE_COLLABORATIF} className={styles.registerLink}>
            Créer un compte
          </ExternalLink>
        </p>

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.forgotPasswordLinkContainer}>
            <ExternalLink
              href={EXTERNAL_LINKS.GEOPF_SSO_RESET_CREDENTIALS}
              className={styles.forgotPasswordLink}
            >
              Mot de passe oublié ?
            </ExternalLink>
          </div>

          {error && <p className={typography.error}>{error}</p>}

          <Button type="submit" className={styles.submitButton} loading={isSubmitting}>
            Se connecter avec mon compte IGN
          </Button>
        </form>
      </div>
    </div>
  );
}
