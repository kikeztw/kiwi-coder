export type IpcHandler = (payload: unknown) => Promise<unknown>;

export type IpcRegistry = Record<string, IpcHandler>;

export function createDefaultIpcHandlers(): IpcRegistry {
  return {
    'session:list': async () => [],
    'session:create': async (payload) => payload,
    'session:delete': async () => ({ deleted: true }),
  };
}
