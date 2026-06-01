import React from 'react';
import ElectronApp from './App.js';

type CreateElectronRendererInput = {
  pathname: string;
};

export function createElectronRenderer(input: CreateElectronRendererInput): React.ReactElement {
  return <ElectronApp pathname={input.pathname} />;
}

export { ElectronApp };
