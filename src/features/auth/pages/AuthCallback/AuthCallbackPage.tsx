import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  consumeOAuthCallbackRetry,
  handleOAuthCallback,
  isStaleOAuthCallbackError,
} from '@/infra/auth/authService';
import { Button } from '@/shared/ui/Button';
import { Loading } from '@/shared/ui/Loading';

import screen from '@/shared/styles/screen.module.css';
import styles from './AuthCallbackPage.module.css';

/**
 * Callback OAuth web : lit ?code= dans l’URL et échange le code contre des jetons.
 * Si le code n’est plus échangeable (page restaurée, rechargée…), relance une fois le SSO
 * automatiquement plutôt que d’enfermer l’utilisateur sur l’écran d’erreur.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUserFromOAuthCallback, loginWithOAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');

  useEffect(() => {
    let cancelled = false;

    async function processCallback() {
      if (errorParam) {
        setError('La connexion a été refusée ou annulée.');
        return;
      }

      if (!code) {
        setError('Code d’autorisation absent dans l’URL de retour.');
        return;
      }

      try {
        const result = await handleOAuthCallback(code);

        if (result.success && result.user) {
          await setUserFromOAuthCallback(result.user);
          if (!cancelled) {
            navigate('/map', { replace: true });
          }
          return;
        }

        if (cancelled) {
          return;
        }

        if (isStaleOAuthCallbackError(result.error) && consumeOAuthCallbackRetry()) {
          await loginWithOAuth();
          return;
        }

        setError(result.error?.message ?? 'Échec de la finalisation de la connexion.');
      } catch {
        if (!cancelled) {
          setError('Échec de la finalisation de la connexion.');
        }
      }
    }

    void processCallback();

    return () => {
      cancelled = true;
    };
  }, [code, errorParam, navigate, setUserFromOAuthCallback, loginWithOAuth]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const result = await loginWithOAuth();
      if (!result.success && result.error?.message !== 'OAuth redirect') {
        setError(result.error?.message ?? 'Échec de la connexion');
      }
    } finally {
      setIsRetrying(false);
    }
  };

  if (error) {
    return (
      <div className={`${styles.container} ${screen.screenContainer}`}>
        <h1 className="page-title">Erreur de connexion</h1>
        <p className={styles.textError}>{error}</p>
        <Button className={styles.backButton} loading={isRetrying} onClick={() => void handleRetry()}>
          Réessayer la connexion
        </Button>
        <Button className={styles.backButton} variant="outline" onClick={() => navigate('/map', { replace: true })}>
          Retour à la carte
        </Button>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${screen.screenContainer}`}>
      <h1 className="page-title">Connexion en cours…</h1>
      <Loading label="Finalisation de l’authentification…" />
    </div>
  );
}
