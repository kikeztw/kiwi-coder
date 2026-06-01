export const electronRoutes = {
  chat: '/chat',
  settings: '/settings',
  sessions: '/sessions',
} as const;

export type ElectronRoute = (typeof electronRoutes)[keyof typeof electronRoutes];
