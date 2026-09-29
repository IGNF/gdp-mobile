import { Navigate } from 'react-router-dom';

import { isWelcomeSeen } from '@/features/welcome/hooks/useFirstRun';
import { config } from '@/shared/config/env';

function homeRedirectPath(): string {
  if (!isWelcomeSeen()) {
    return '/welcome';
  }
  return config.authRequired ? '/login' : '/map';
}

/** Écran d'accueil (`/`) : redirige vers l'onboarding, la connexion ou la carte. */
export function HomeRedirect() {
  return <Navigate to={homeRedirectPath()} replace />;
}
