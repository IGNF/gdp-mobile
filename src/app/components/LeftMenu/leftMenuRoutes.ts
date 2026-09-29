const leftMenuOverlayRoutes = [
  '/my-account',
  '/logout',
  '/community',
  '/settings',
  '/help',
  '/about',
] as const;

export type LeftMenuOverlayRoute = (typeof leftMenuOverlayRoutes)[number];

export type LeftMenuNavigateRoute = '/login';

export type LeftMenuRoute = LeftMenuOverlayRoute | LeftMenuNavigateRoute;

export function isLeftMenuOverlayRoute(route: string): route is LeftMenuOverlayRoute {
  return leftMenuOverlayRoutes.includes(route as LeftMenuOverlayRoute);
}
