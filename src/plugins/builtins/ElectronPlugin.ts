import type { IUIPlugin } from '../interfaces/IUIPlugin.js';

export class ElectronPlugin implements IUIPlugin {
  id = 'electron';
  name = 'Electron Plugin';
  routes = [
    { path: '/chat', title: 'Electron Chat' },
    { path: '/settings', title: 'Electron Settings' },
    { path: '/sessions', title: 'Electron Sessions' },
  ];

  async mount(): Promise<void> {}

  async unmount(): Promise<void> {}
}
