import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

const tsRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'prettier/prettier': 'error',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
};

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '.husky/**',
      'apps/web/postcss.config.js',
      'apps/web/tailwind.config.ts',
    ],
  },
  // Backend (apps/api) — Node, NestJS
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './apps/api/tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
    },
    plugins: { '@typescript-eslint': tseslint, prettier },
    rules: tsRules,
  },
  // Frontend (apps/web) — React + browser. `projectService: true` lets each
  // file resolve to the correct tsconfig (app, node, or test) automatically
  // so test files and config files don't need explicit project entries.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { '@typescript-eslint': tseslint, prettier },
    rules: tsRules,
  },
  // Shared package
  {
    files: ['packages/shared/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './packages/shared/tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
    },
    plugins: { '@typescript-eslint': tseslint, prettier },
    rules: tsRules,
  },
  prettierConfig,
];
