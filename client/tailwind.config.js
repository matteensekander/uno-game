/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'uno-red': '#FF3333',
        'uno-yellow': '#FFD700',
        'uno-green': '#00CC44',
        'uno-blue': '#0088FF',
        'neon-pink': '#FF00FF',
        'neon-cyan': '#00FFFF',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'shake': 'shake 0.4s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px #FF3333, 0 0 20px #FF3333' },
          '50%': { boxShadow: '0 0 20px #FF3333, 0 0 40px #FF3333, 0 0 60px #FF3333' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0)' },
          '80%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
