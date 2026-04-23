import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#fff8ed',
          100: '#ffefd3',
          200: '#ffdba5',
          300: '#ffc16d',
          400: '#ff9d33',
          500: '#ff7f0a',
          600: '#f06200',
          700: '#c74900',
          800: '#9e3a00',
          900: '#7f3207',
          950: '#451600',
        },
        surface: {
          50:  '#f8f7f4',
          100: '#eeecea',
          200: '#dddbd6',
          300: '#c5c1ba',
          400: '#a9a397',
          500: '#908980',
          600: '#7a7269',
          700: '#645d55',
          800: '#534e47',
          900: '#46403a',
          950: '#1c1a17',
        }
      }
    },
  },
  plugins: [],
} satisfies Config