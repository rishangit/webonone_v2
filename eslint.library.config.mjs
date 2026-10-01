import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Shared ESLint flat config for TypeScript libraries (no React).
 * @param {string} tsconfigRootDir - Absolute path to the package root (import.meta.dirname).
 */
export function createLibraryTsConfig(tsconfigRootDir) {
  return tseslint.config(
    { ignores: ['dist/**', 'node_modules/**'] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        ecmaVersion: 2022,
        globals: { ...globals.browser, ...globals.node },
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
  )
}
