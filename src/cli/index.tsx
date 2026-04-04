#!/usr/bin/env node
import 'dotenv/config';
import { resolve } from 'path';
import { program } from 'commander';
import { render } from 'ink';
import App from './App.js';

// Parse CLI arguments
program
  .name('kiwi')
  .description('AI coding assistant with interactive terminal')
  .option('-p, --path <path>', 'project path', process.cwd());

program.parse();
const options = program.opts();
const projectPath = resolve(options.path);

// Clear terminal before starting
process.stdout.write('\x1Bc');

render(<App projectPath={projectPath} />);
