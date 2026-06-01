#!/usr/bin/env node
import 'dotenv/config';
import { resolve } from 'path';
import { program } from 'commander';
import { render } from '@orchetron/storm';
import App from '../presentation/terminal/App.js';
import { preloadModelCache } from '../presentation/terminal/services/modelsCache.js';

// Parse CLI arguments
program
  .name('kiwi')
  .description('AI coding assistant with interactive terminal')
  .option('-p, --path <path>', 'project path', process.cwd());

program.parse();
const options = program.opts();
const projectPath = resolve(options.path);

// Kick off background fetches for model lists so /model is responsive.
preloadModelCache();

async function main() {
  try {
    const app = render(<App projectPath={projectPath} />);
    await app.waitUntilExit();
  } catch (error: unknown) {
    console.error('Error rendering:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
