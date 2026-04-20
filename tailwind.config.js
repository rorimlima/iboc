export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          800: '#102A43',
          900: '#0A1827',
        },
        gold: {
          50: '#FBF7EF',
          100: '#F3EBD9',
          200: '#E6D2AA',
          400: '#D4B473',
          500: '#C5A059',
          600: '#A6823C',
        },
        stone: {
          50: '#FAFAF9',
          100: '#F5F5F4',
        }
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(197, 160, 89, 0.3)',
      },
       animation: {
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
    },
  },
  plugins: [],
}
