import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // Base configs
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Allow underscore-prefixed unused vars (common in stub/placeholder code)
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // React
  {
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // Not needed with the new JSX transform
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',

      // Enforce CSS classes over inline styles on components
      'react/forbid-component-props': ['error', { forbid: ['style'] }],
    },
  },

  // Import rules
  {
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'import/no-default-export': 'error',
      'import/no-unresolved': ['error', { ignore: ['^@the-green-felt/'] }],
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'never',
        },
      ],
    },
  },

  // Prettier must be last to override formatting rules
  prettier,

  // Ignored paths
  {
    ignores: ['**/dist/', '**/node_modules/', '**/*.js', '**/*.mjs'],
  },
);
