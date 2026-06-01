import { resolveWebRoute } from './router/WebRouter.js';
import { ChatPage, SessionsPage, SettingsPage } from './components/index.js';

type WebAppProps = {
  pathname: string;
};

function extractSessionId(pathname: string): string {
  const segments = pathname.split('/');
  return segments[2] || 'unknown';
}

export default function WebApp({ pathname }: WebAppProps) {
  const route = resolveWebRoute(pathname);

  if (route === 'chat') {
    return <ChatPage sessionId={extractSessionId(pathname)} />;
  }

  if (route === 'settings') {
    return <SettingsPage />;
  }

  if (route === 'sessions') {
    return <SessionsPage />;
  }

  return <>Web Route Not Found</>;
}
