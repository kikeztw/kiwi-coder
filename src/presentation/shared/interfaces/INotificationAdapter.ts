export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface INotificationAdapter {
  notify(message: string, level?: NotificationLevel): void;
  alert(message: string): void;
}
