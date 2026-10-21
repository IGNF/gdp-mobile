import { useCallback, useState } from 'react';
import { RiCloudOffLine } from 'react-icons/ri';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { FlashMessage } from '@/shared/ui/FlashMessage';

/** Écrans où le message n'a pas de sens : il attend qu'on en sorte pour s'afficher. */
const HIDDEN_ON_PATHS = new Set(['/welcome', '/login', '/auth/callback']);

/**
 * Prévient l'utilisateur qu'il n'est pas connecté : à l'ouverture de l'appli une fois la
 * session vérifiée, puis à chaque déconnexion. Un appui mène à la page de connexion.
 */
export function NotConnectedFlash() {
  const { isAuthenticated, isLoading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // null tant que la restauration de session initiale n'a pas abouti.
  const [lastAuthenticated, setLastAuthenticated] = useState<boolean | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Ajusté pendant le rendu : on réagit au passage « connecté / non connecté », pas à un
  // système externe. Pendant isLoading (restauration, déconnexion SSO…) l'état est transitoire.
  if (!isLoading && lastAuthenticated !== isAuthenticated) {
    setLastAuthenticated(isAuthenticated);
    setIsPending(!isAuthenticated);
  }

  const handleClose = useCallback(() => setIsPending(false), []);

  const handleClick = useCallback(() => {
    setIsPending(false);
    navigate('/login');
  }, [navigate]);

  if (!isPending || HIDDEN_ON_PATHS.has(pathname)) {
    return null;
  }

  return (
    <FlashMessage icon={<RiCloudOffLine />} onClose={handleClose} onClick={handleClick}>
      Vous n’êtes pas connecté
    </FlashMessage>
  );
}
