// Class-hygiene lint only — oxlint (`npm run lint`) owns JavaScript.
// Rules here enforce the token system from docs/DESIGN_SYSTEM.md.
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
      // No two classes fighting over one property (caught a real
      // rounded-md/rounded-xl collision during review).
      'tailwindcss/no-contradicting-classname': 'error',
      // Tokens over arbitrary values. The CLI runs with `--max-warnings 0`, so
      // a deliberate one-off needs an inline disable and a reason — see the
      // `env()` tab-bar padding and header grid tracks in Navbar.jsx.
      'tailwindcss/no-arbitrary-value': 'warn',
      // Consistent class order (autofixable).
      'tailwindcss/classnames-order': 'warn',
      // Project animation utilities are custom by design.
      'tailwindcss/no-custom-classname': ['warn', { whitelist: ['flip-.*', 'flipped', 'animate-.*', 'confetti-piece'] }],
    },
  },
]
