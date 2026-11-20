import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', '_site/**'],
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest' },
    rules: {
      'no-undef': ['error', { typeof: true }],
      'no-unused-vars': ['error', {
        args: 'after-used',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  {
    files: ['shared/**/*.js', 'library/**/*.js', 'games/*/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser },
    },
  },
  {
    files: ['library/app.js', 'games/*/app.js', 'games/hexagon/tutorial.js'],
    languageOptions: { globals: { Beans: 'readonly' } },
  },
  {
    files: ['games/secret-code/app.js'],
    languageOptions: { globals: { SecretCode: 'readonly' } },
  },
  {
    files: ['games/loop-fence/app.js'],
    languageOptions: { globals: { LoopFence: 'readonly' } },
  },
  {
    files: ['games/hexagon/app.js', 'games/hexagon/tutorial.js'],
    languageOptions: { globals: { Hexagon: 'readonly' } },
  },
  {
    files: ['games/hexagon/tutorial.js'],
    languageOptions: { globals: { HexagonExample: 'readonly' } },
  },
  {
    files: ['games/*/engine.js', 'games/*/tutorial-data.js', 'shared/tutorial-data.js'],
    languageOptions: { globals: { module: 'readonly' } },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { sourceType: 'module', globals: { ...globals.node } },
  },
];
