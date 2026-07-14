import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Flat config. Type-aware linting is intentionally off for now (no project
// service) to keep `eslint .` fast; enable it when the pipeline lands.
export default tseslint.config(
  {
    ignores: ['node_modules/**', '.output/**', '.wxt/**', 'dist/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,mts,cts}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
  },
);
