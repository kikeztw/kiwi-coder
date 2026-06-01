import { electronRoutes } from './router/routes.js';
import { resolveElectronRoute } from './router/ElectronRouter.js';

type ElectronAppProps = {
  pathname: string;
};

export default function ElectronApp({ pathname }: ElectronAppProps) {
  const route = resolveElectronRoute(pathname);

  if (route === electronRoutes.chat) {
    return <>Electron Chat</>;
  }

  if (route === electronRoutes.settings) {
    return <>Electron Settings</>;
  }

  if (route === electronRoutes.sessions) {
    return <>Electron Sessions</>;
  }

  return <>Electron Route Not Found</>;
}
