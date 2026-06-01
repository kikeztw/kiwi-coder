import React, { createContext, useContext } from 'react';
import type { IUIAdapter } from '../interfaces/IUIAdapter.js';

const UIAdapterContext = createContext<IUIAdapter | undefined>(undefined);

type UIAdapterProviderProps = {
  adapter: IUIAdapter;
  children: React.ReactNode;
};

export function UIAdapterProvider({ adapter, children }: UIAdapterProviderProps) {
  return <UIAdapterContext.Provider value={adapter}>{children}</UIAdapterContext.Provider>;
}

export function useUIAdapter(): IUIAdapter {
  const adapter = useContext(UIAdapterContext);
  if (!adapter) {
    throw new Error('useUIAdapter must be used within UIAdapterProvider');
  }
  return adapter;
}
