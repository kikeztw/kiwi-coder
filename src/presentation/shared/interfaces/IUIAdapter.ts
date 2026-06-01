export type UIRole = 'user' | 'assistant' | 'system' | 'tool';

export type UIMessagePayload = {
  sessionId: string;
  role: UIRole;
  content: string;
};

export interface IUIAdapter {
  readonly name: string;
  renderMessage(message: UIMessagePayload): void;
  showSpinner(active: boolean): void;
  promptInput(prompt: string): Promise<string>;
  navigate(route: string): void;
}
