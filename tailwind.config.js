/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#f3fbfc',
          100: '#e2f6f8',
          200: '#c2edf0',
          300: '#95dfe4',
          400: '#5cced6',
          500: '#31bac4',
          600: '#24888f',
          700: '#1d6d72',
          800: '#16555a',
          900: '#124649',
          950: '#0c2f31',
        },
      },
    },
  },
  plugins: [
    // require('tailwind-scrollbar')({ nocompatible: true }),
  ],
};