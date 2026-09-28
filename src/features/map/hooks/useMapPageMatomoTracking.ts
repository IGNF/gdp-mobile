import { useEffect } from 'react';

import type { LeftMenuOverlayRoute } from '@/app/components/LeftMenu';
import { trackEvent, trackOverlayOpen } from '@/infra/analytics/matomo';

const MENU_OVERLAY_LABELS: Record<Exclude<LeftMenuOverlayRoute, '/logout'>, string> = {
  '/my-account': 'Mon compte',
  '/settings': 'Paramètres',
  '/favorites': 'Mes favoris',
  '/community': 'Communauté',
  '/help': 'Aide',
  '/about': 'À propos',
};

interface UseMapPageMatomoTrackingOptions {
  activeOverlay: LeftMenuOverlayRoute | null;
  isLegendOpen: boolean;
  isLayersPanelOpen: boolean;
}

export function useMapPageMatomoTracking({
  activeOverlay,
  isLegendOpen,
  isLayersPanelOpen,
}: UseMapPageMatomoTrackingOptions): void {
  useEffect(() => {
    if (!activeOverlay) {
      return;
    }

    if (activeOverlay === '/logout') {
      trackEvent('Auth', 'Déconnexion');
      return;
    }

    trackOverlayOpen('Menu', MENU_OVERLAY_LABELS[activeOverlay]);
  }, [activeOverlay]);

  useEffect(() => {
    if (isLegendOpen) {
      trackOverlayOpen('Carte', 'Légende');
    }
  }, [isLegendOpen]);

  useEffect(() => {
    if (isLayersPanelOpen) {
      trackOverlayOpen('Carte', 'Couches');
    }
  }, [isLayersPanelOpen]);
}
