import { createBrowserRouter, Navigate } from 'react-router-dom';

import { isWelcomeSeen } from '@/features/welcome/hooks/useFirstRun';
import { config } from '@/shared/config/env';

import { AuthCallbackPage } from '@/features/auth/pages/AuthCallback/AuthCallbackPage';
import { LoginPage } from '@/features/auth/pages/Login/LoginPage';
import { WelcomePage } from '@/features/welcome/pages/WelcomePage';
import { MapPage } from '@/pages/map/MapPage';
import { MyReportsPage } from '@/pages/report/MyReportsPage';
import { ReportDetailPage } from '@/pages/report/ReportDetailPage';

function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') {
    return undefined;
  }
  return base.replace(/\/$/, '');
}

function homeRedirectPath(): string {
  if (!isWelcomeSeen()) {
    return '/welcome';
  }
  return config.authRequired ? '/login' : '/map';
}

function HomeRedirect() {
  return <Navigate to={homeRedirectPath()} replace />;
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <HomeRedirect />,
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
    {
      path: '/reports/:id',
      element: <ReportDetailPage />,
    },
  ],
  { basename: routerBasename() },
);
