type ChatPageProps = {
  sessionId: string;
};

export function ChatPage({ sessionId }: ChatPageProps) {
  return <>Web Chat Session: {sessionId}</>;
}
