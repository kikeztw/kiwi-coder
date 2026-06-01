import type { IUIPlugin } from '../interfaces/IUIPlugin.js';

export class TerminalPlugin implements IUIPlugin {
  id = 'terminal';
  name = 'Terminal Plugin';
  routes = [
    { path: '/chat', title: 'Terminal Chat' },
    { path: '/model', title: 'Terminal Model Selector' },
    { path: '/sessions', title: 'Terminal Sessions' },
  ];

  async mount(): Promise<void> {}

  async unmount(): Promise<void> {}
}
