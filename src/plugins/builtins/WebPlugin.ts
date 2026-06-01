import type { IUIPlugin } from '../interfaces/IUIPlugin.js';

export class WebPlugin implements IUIPlugin {
  id = 'web';
  name = 'Web Plugin';
  routes = [
    { path: '/chat/:sessionId', title: 'Web Chat' },
    { path: '/settings', title: 'Web Settings' },
    { path: '/sessions', title: 'Web Sessions' },
  ];

  async mount(): Promise<void> {}

  async unmount(): Promise<void> {}
}
