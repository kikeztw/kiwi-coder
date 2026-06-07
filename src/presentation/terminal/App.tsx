import { useCallback } from 'react';
import { useInput, useTui } from '@orchetron/storm';
import { ChatView } from './components/ChatView.js';
import { SessionProvider, useSessionContext } from './context/index.js';
import { clearTerminal } from './services/terminal.js';

function AppContent() {
  const { currentSession, saveCurrentSession } = useSessionContext();
  const { exit } = useTui();

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

  return (
    <ChatView
      key={currentSession?.id}
      onExit={handleExit}
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
