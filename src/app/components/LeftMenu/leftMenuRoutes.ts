export const leftMenuOverlayRoutes = [
  '/my-account',
  '/logout',
  '/settings',
  '/help',
  '/about',
] as const;

export type LeftMenuOverlayRoute = (typeof leftMenuOverlayRoutes)[number];

export const leftMenuNavigateRoutes = ['/reports', '/login'] as const;

export type LeftMenuNavigateRoute = (typeof leftMenuNavigateRoutes)[number];

export type LeftMenuRoute = LeftMenuOverlayRoute | LeftMenuNavigateRoute;

export function isLeftMenuOverlayRoute(route: string): route is LeftMenuOverlayRoute {
  return leftMenuOverlayRoutes.includes(route as LeftMenuOverlayRoute);
}
