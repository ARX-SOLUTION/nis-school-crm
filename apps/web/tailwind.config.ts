import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        nordic: {
          blue: '#1D4ED8',
          blueHover: '#1E40AF',
          slate: '#0F172A',
          sage: '#047857',
          ochre: '#B45309',
          crimson: '#B91C1C',
        },
      },
      minHeight: {
        tap: '44px',
      },
      minWidth: {
        tap: '44px',
      },
    },
  },
  plugins: [],
} satisfies Config;
