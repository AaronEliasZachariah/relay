// Flat ESLint config (Expo preset). Lints the app (app/ + src/ + __tests__/).
const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.expo/**',
      'server/**',
      'scripts/**',
      'babel.config.js',
      'jest.config.js',
      'jest.setup.js',
      'assets/**',
    ],
  },
];
