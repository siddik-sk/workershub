/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f3f6fa',
          100: '#e5ebf3',
          200: '#c8d4e5',
          300: '#9bb0cc',
          400: '#6785ab',
          500: '#456589',
          600: '#334e6d',
          700: '#293e56',
          800: '#1c2d42',
          900: '#0b1f3a',
          950: '#071529',
        },
        brand: {
          50: '#effcf9',
          100: '#c9f7ed',
          200: '#93eedd',
          300: '#58dfc9',
          400: '#26c7b1',
          500: '#0ea99a',
          600: '#0b8a80',
          700: '#0d6e68',
          800: '#105955',
          900: '#124a47',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(11,31,58,0.04), 0 12px 30px -12px rgba(11,31,58,0.12)',
        card: '0 1px 2px rgba(11,31,58,0.05), 0 8px 24px -16px rgba(11,31,58,0.18)',
        lift: '0 24px 60px -24px rgba(11,31,58,0.28)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'fade-in': 'fade-in 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};
