import tailwindcss from 'eslint-plugin-tailwindcss'

export default [
  {
    files: ['src/**/*.{jsx,js}'],
    ignores: ['src/**/*.test.js'],
    plugins: { tailwindcss },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: {
      tailwindcss: {
        cssConfigPath: './src/index.css',
      },
    },
    rules: {
      'tailwindcss/no-contradicting-classname': 'error',
      'tailwindcss/no-arbitrary-value': 'warn',
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-custom-classname': ['warn', { whitelist: ['flip-.*', 'flipped', 'animate-.*', 'confetti-piece', 'study-stage-body', 'menu-surface'] }],
    },
  },
]
