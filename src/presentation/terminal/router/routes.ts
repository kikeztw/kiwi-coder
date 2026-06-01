export const terminalRoutes = {
  chat: '/chat',
  model: '/model',
  sessions: '/sessions',
  newSession: '/new-session',
  deleteSession: '/delete-session',
} as const;

export type TerminalRoute = (typeof terminalRoutes)[keyof typeof terminalRoutes];
