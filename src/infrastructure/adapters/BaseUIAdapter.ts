import type {
  INotificationAdapter,
  IThemeAdapter,
  IUIAdapter,
  NotificationLevel,
  ThemePalette,
  UIMessagePayload,
} from '../../presentation/shared/interfaces/index.js';

export type UIAdapterState = {
  route: string;
  spinnerActive: boolean;
  messages: UIMessagePayload[];
  prompts: string[];
  notifications: Array<{ level: NotificationLevel; message: string }>;
  activeTheme: string;
};

const DEFAULT_THEME: ThemePalette = {
  primary: '#00d4ff',
  secondary: '#4f46e5',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  muted: '#94a3b8',
};

export abstract class BaseUIAdapter implements IUIAdapter, IThemeAdapter, INotificationAdapter {
  protected state: UIAdapterState = {
    route: '/chat',
    spinnerActive: false,
    messages: [],
    prompts: [],
    notifications: [],
    activeTheme: 'default',
  };

  abstract readonly name: string;

  renderMessage(message: UIMessagePayload): void {
    this.state.messages.push(message);
  }

  showSpinner(active: boolean): void {
    this.state.spinnerActive = active;
  }

  async promptInput(prompt: string): Promise<string> {
    this.state.prompts.push(prompt);
    return '';
  }

  navigate(route: string): void {
    this.state.route = route;
  }

  getColors(): ThemePalette {
    return DEFAULT_THEME;
  }

  applyTheme(themeName: string): void {
    this.state.activeTheme = themeName;
  }

  notify(message: string, level: NotificationLevel = 'info'): void {
    this.state.notifications.push({ level, message });
  }

  alert(message: string): void {
    this.state.notifications.push({ level: 'warning', message });
  }

  snapshot(): Readonly<UIAdapterState> {
    return this.state;
  }
}
