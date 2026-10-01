import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Onest', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#84CC16',
          hover: '#7DBA14',
        },
        secondary: '#2563EB',
        tertiary: '#0F172A',
        neutral: {
          // 400 is the lightest neutral allowed for text on `surface` (#FFF).
          // #64748B measures 4.76:1 and passes WCAG AA for normal text; the
          // previous #94A3B8 measured 2.56:1 and failed. It is also the token
          // DESIGN.md documents as `neutral`, so 500/600 step darker from it
          // to keep the scale monotonic.
          400: '#64748B',
          500: '#475569',
          600: '#334155',
        },
        surface: '#FFFFFF',
        border: '#E2E8F0',
        muted: {
          surface: '#F8FAFC',
        },
        success: '#16A34A',
        error: '#EF4444',
      },
      minHeight: {
        tap: '48px',
      },
      minWidth: {
        tap: '48px',
      },
    },
  },
  plugins: [],
} satisfies Config;
