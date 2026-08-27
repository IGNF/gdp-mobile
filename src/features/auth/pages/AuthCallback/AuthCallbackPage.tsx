import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { handleOAuthCallback } from '@/infra/auth/authService';
import { Button } from '@/shared/ui/Button';
import { Loading } from '@/shared/ui/Loading';

import screen from '@/shared/styles/screen.module.css';
import typography from '@/shared/styles/typography.module.css';

import styles from './AuthCallbackPage.module.css';

/**
 * Callback OAuth web : lit ?code= dans l’URL et échange le code contre des jetons.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUserFromOAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function processCallback() {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

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
          navigate('/map', { replace: true });
          return;
        }

        if (cancelled) {
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
  }, [navigate, searchParams, setUserFromOAuthCallback]);

  if (error) {
    return (
      <div className={`${styles.container} ${screen.screenContainer}`}>
        <h1 className={typography.title}>Erreur de connexion</h1>
        <p className={typography.error}>{error}</p>
        <Button className={styles.backButton} onClick={() => navigate('/login', { replace: true })}>
          Retour à la connexion
        </Button>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${screen.screenContainer}`}>
      <h1 className={typography.title}>Connexion en cours…</h1>
      <Loading label="Finalisation de l’authentification…" />
    </div>
  );
}
