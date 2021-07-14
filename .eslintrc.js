module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier,
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    'semi': 'off',
    '@typescript-eslint/semi': ['error'],
  }
};
