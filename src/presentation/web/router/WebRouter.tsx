import { webRoutes, type WebRouteName } from './routes.js';

function isChatPath(pathname: string): boolean {
  return /^\/chat\/[^/]+$/.test(pathname);
}

export function resolveWebRoute(pathname: string): WebRouteName | null {
  if (isChatPath(pathname)) {
    return 'chat';
  }

  if (pathname === webRoutes.settings) {
    return 'settings';
  }

  if (pathname === webRoutes.sessions) {
    return 'sessions';
  }

  return null;
}
