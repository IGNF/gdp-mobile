import { createBrowserRouter, Navigate } from 'react-router-dom';

import { config } from '@/shared/config/env';

import { AuthCallbackPage } from '@/features/auth/pages/AuthCallback/AuthCallbackPage';
import { LoginPage } from '@/features/auth/pages/Login/LoginPage';
import { WelcomePage } from '@/features/welcome/pages/WelcomePage';
import { MapPage } from '@/pages/map/MapPage';
import { MyReportsPage } from '@/pages/report/MyReportsPage';

function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') {
    return undefined;
  }
  return base.replace(/\/$/, '');
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Navigate to={config.authRequired ? '/welcome' : '/map'} replace />,
    },
    {
      path: '/welcome',
      element: <WelcomePage />,
    },
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/auth/callback',
      element: <AuthCallbackPage />,
    },
    {
      path: '/map',
      element: <MapPage />,
    },
    {
      path: '/reports',
      element: <MyReportsPage />,
    },
  ],
  { basename: routerBasename() },
);
