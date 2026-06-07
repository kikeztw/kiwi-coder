import { useCallback, useState } from 'react';
import { useInput, useTui } from '@orchetron/storm';
import { ChatView } from './components/ChatView.js';
import { ProviderSelector } from './components/ProviderSelector.js';
import { SessionProvider, useSessionContext } from './context/index.js';
import { clearTerminal } from './services/terminal.js';
import type { ProviderId } from '../shared/providers/index.js';

type TerminalView = 'chat' | 'provider-selector';

function AppContent() {
  const { currentSession, saveCurrentSession } = useSessionContext();
  const { exit } = useTui();
  const [view, setView] = useState<TerminalView>('chat');
  const [pendingProvider, setPendingProvider] = useState<ProviderId | null>(null);

  const handleExit = useCallback(() => {
    saveCurrentSession();
    clearTerminal();
    exit();
  }, [saveCurrentSession, exit]);

  useInput((event) => {
    if (event.ctrl && event.key === 'c') {
      handleExit();
    }
  }, { isActive: true });

  const showProviderSelector = useCallback(() => {
    setView('provider-selector');
  }, []);

  const showChat = useCallback(() => {
    setView('chat');
  }, []);

  const handleProviderSelect = useCallback((provider: ProviderId) => {
    setPendingProvider(provider);
    setView('chat');
  }, []);

  if (view === 'provider-selector') {
    return (
      <ProviderSelector
        currentProvider={pendingProvider}
        onSelect={handleProviderSelect}
        onCancel={showChat}
      />
    );
  }

  return (
    <ChatView
      key={currentSession?.id}
      onExit={handleExit}
      onShowProviderSelector={showProviderSelector}
    />
  );
}

export default function App({ projectPath }: { projectPath: string }) {
  return (
    <SessionProvider projectPath={projectPath} initialAgent="coder">
      <AppContent />
    </SessionProvider>
  );
}
