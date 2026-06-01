export const webRoutes = {
  chat: '/chat/:sessionId',
  settings: '/settings',
  sessions: '/sessions',
} as const;

export type WebRoutePattern = (typeof webRoutes)[keyof typeof webRoutes];
export type WebRouteName = keyof typeof webRoutes;
