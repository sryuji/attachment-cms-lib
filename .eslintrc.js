module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: ['google', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'require-jsdoc': 'off',
    // importしたものを型宣言だけに利用してる場合に許可されるように設定
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { vars: 'all', args: 'none', ignoreRestSiblings: false }],
  },
}
