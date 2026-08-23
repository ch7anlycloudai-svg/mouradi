/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FE8B7C',
          hover: '#F47768',
          light: '#FFF1EE',
          50: '#FFF6F4',
        },
        brand: {
          bg: '#FFFFFF',
          'bg-secondary': '#FFF1EE',
          text: '#0A0A0A',
          'text-secondary': '#555555',
          'text-muted': '#888888',
          border: '#EDEDED',
          'border-dark': '#D4D4D4',
        },
      },
      fontFamily: {
        arabic: ['Tajawal', 'sans-serif'],
        french: ['Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      letterSpacing: {
        'widest-plus': '0.15em',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
