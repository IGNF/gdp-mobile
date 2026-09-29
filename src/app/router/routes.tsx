import { createBrowserRouter } from 'react-router-dom';

import { AppLayout } from '@/app/router/AppLayout';
import { HomeRedirect } from '@/app/router/HomeRedirect';
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallback/AuthCallbackPage';
import { LoginPage } from '@/features/auth/pages/Login/LoginPage';
import { WelcomePage } from '@/features/welcome/pages/WelcomePage';
import { MapPage } from '@/pages/map/MapPage';
import { MyReportsPage } from '@/pages/report/MyReportsPage';
import { ReportDetailPage } from '@/pages/report/ReportDetailPage';
import { ReportHistoryPage } from '@/pages/report/ReportHistoryPage';
import { ReportHistoryDetailPage } from '@/pages/report/ReportHistoryDetailPage';

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
      element: <AppLayout />,
      children: [
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
          path: '/reports/history',
          element: <ReportHistoryPage />,
        },
        {
          path: '/reports/history/:id',
          element: <ReportHistoryDetailPage />,
        },
        {
          path: '/reports/:id',
          element: <ReportDetailPage />,
        },
      ],
    },
  ],
  { basename: routerBasename() },
);
