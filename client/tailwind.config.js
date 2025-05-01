/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lime-green': '#ABFF00',
        'lime-light': '#D1FF4D',
        'lime-dark': '#85CC00',
        'dark-bg': '#0A0E14',
        'card-bg': '#111922',
        'text-primary': '#F9FAFB',
        'text-secondary': '#D1D5DB',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'rajdhani': ['Rajdhani', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'lime': '0 0 10px rgba(171, 255, 0, 0.7)',
        'inner-lime': 'inset 0 0 5px rgba(171, 255, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, rgba(171, 255, 0, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(171, 255, 0, 0.1) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '30px 30px',
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(10px)',
      },
    },
  },
  plugins: [],
}