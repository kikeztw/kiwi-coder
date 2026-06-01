import { electronRoutes, type ElectronRoute } from './routes.js';

export function resolveElectronRoute(pathname: string): ElectronRoute | null {
  if (pathname === electronRoutes.chat) {
    return electronRoutes.chat;
  }

  if (pathname === electronRoutes.settings) {
    return electronRoutes.settings;
  }

  if (pathname === electronRoutes.sessions) {
    return electronRoutes.sessions;
  }

  return null;
}
