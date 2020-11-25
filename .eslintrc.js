module.exports = {
  env: {
    es2021: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'sort-keys-fix'],
  rules: {
    'sort-keys-fix/sort-keys-fix': 'warn',
  },
};
