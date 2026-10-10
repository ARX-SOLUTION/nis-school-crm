import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Onest', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB', // Tech Blue 600
          hover: '#3B82F6', // Tech Blue 500
          active: '#1D4ED8', // Tech Blue 700
          light: '#60A5FA', // Tech Blue 400
        },
        secondary: '#60A5FA',
        tertiary: '#F8FAFC', // Slate 50 — primary crisp text on dark surfaces
        neutral: {
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8', // High-contrast muted captions (5.3:1 on Slate 900)
          500: '#64748B', // Placeholders, dividers
          600: '#475569',
          700: '#334155', // Elevated container borders
          800: '#1E293B', // Sub-surfaces & table headers
          900: '#0F172A', // Card & panel surface
          950: '#090D16', // Root application canvas
        },
        surface: {
          DEFAULT: '#0F172A', // Slate 900
          subtle: '#131B2E', // Table headers & filter bars
          elevated: '#1E293B', // Modals, popovers, dropdowns
        },
        border: {
          DEFAULT: '#1E293B', // Slate 800 precision border
          strong: '#334155', // Elevated borders & modals
        },
        muted: {
          surface: '#090D16', // Slate 950 canvas background
          subtle: '#1E293B', // Slate 800 sub-surfaces
        },
        success: '#10B981', // Emerald 500
        warning: '#F59E0B', // Amber 500
        error: '#EF4444', // Red 500
        info: '#06B6D4', // Cyan 500
      },
      boxShadow: {
        'dark-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)',
        'dark-lg': '0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)',
      },
      transitionTimingFunction: {
        'out-cubic': 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '75': '75ms',
        '150': '150ms',
        '250': '250ms',
        '350': '350ms',
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
