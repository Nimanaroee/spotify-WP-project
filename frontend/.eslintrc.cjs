module.exports = {
  env: { browser: true, es2021: true },
  extends: ['plugin:react/recommended', 'eslint:recommended'],
  parserOptions: { ecmaFeatures: { jsx: true }, ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react', 'react-hooks'],
  rules: { 'react-hooks/rules-of-hooks': 'error', 'no-unused-vars': ['warn'] },
}
