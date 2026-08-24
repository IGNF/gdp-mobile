import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { handleOAuthCallback } from '@/infra/auth/authService';
import { Button } from '@/shared/ui/Button';
import { Loading } from '@/shared/ui/Loading';

import screen from '@/shared/styles/screen.module.css';
import typography from '@/shared/styles/typography.module.css';

import styles from './AuthCallbackPage.module.css';

const oauthExchangeStorageKey = (code: string): string => `gdp_oauth_exchange_${code}`;

/**
 * Callback OAuth web : lit ?code= dans l’URL et échange le code contre des jetons.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUserFromOAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const isProcessingRef = useRef(false);

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

      if (!localStorage.getItem('temp_code_verifier')) {
        setError(
          'Session OAuth expirée ou incomplète (code verifier absent). ' +
            'Revenez à la page de connexion et réessayez.',
        );
        return;
      }

      const exchangeKey = oauthExchangeStorageKey(code);
      if (sessionStorage.getItem(exchangeKey) === 'done') {
        navigate('/map', { replace: true });
        return;
      }

      if (isProcessingRef.current || sessionStorage.getItem(exchangeKey) === 'processing') {
        return;
      }

      isProcessingRef.current = true;
      sessionStorage.setItem(exchangeKey, 'processing');

      try {
        const result = await handleOAuthCallback(code);
        if (cancelled) {
          return;
        }

        if (result.success && result.user) {
          sessionStorage.setItem(exchangeKey, 'done');
          await setUserFromOAuthCallback(result.user);
          navigate('/map', { replace: true });
        } else {
          sessionStorage.removeItem(exchangeKey);
          setError(result.error?.message ?? 'Échec de la finalisation de la connexion.');
        }
      } catch {
        if (!cancelled) {
          sessionStorage.removeItem(exchangeKey);
          setError('Échec de la finalisation de la connexion.');
        }
      } finally {
        isProcessingRef.current = false;
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
