import React from 'react';
import WebApp from './App.js';

type CreateWebAppInput = {
  pathname: string;
};

export function createWebApp(input: CreateWebAppInput): React.ReactElement {
  return <WebApp pathname={input.pathname} />;
}

export { WebApp };
