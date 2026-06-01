import { createDefaultIpcHandlers, type IpcRegistry } from './ipcHandlers.js';

export type ElectronMainApp = {
  handlers: IpcRegistry;
};

export function createElectronMainApp(): ElectronMainApp {
  return {
    handlers: createDefaultIpcHandlers(),
  };
}
