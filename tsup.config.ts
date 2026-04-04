import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli/index.tsx', 'src/index.ts'],
  format: ['esm'],
  target: 'node20',
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  outDir: 'dist',
  external: ['react', 'ink', 'ink-spinner', 'ink-text-input'],
  esbuildOptions: (options) => {
    options.jsx = 'transform';
    options.jsxFactory = 'React.createElement';
    options.jsxFragment = 'React.Fragment';
  },
});
