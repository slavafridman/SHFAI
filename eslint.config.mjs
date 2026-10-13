import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/dist-test/**', '**/.angular/**', '**/coverage/**'],
  },
  {
    files: ['apps/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
  },
);
