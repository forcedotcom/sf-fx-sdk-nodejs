module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'header',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    'semi': 'off',
    '@typescript-eslint/semi': ['error'],
    "header/header": [2, "line", [
      "Copyright (c) 2021, salesforce.com, inc.",
      "All rights reserved.",
      "SPDX-License-Identifier: BSD-3-Clause",
      "For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause"
    ]],
  }
};
