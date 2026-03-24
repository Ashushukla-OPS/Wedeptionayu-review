
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FEFCF9',
        'bg-warm': '#FFFBF7',
        'rose': '#E91E63',
        'rose-dark': '#C2185B',
        'gold': '#D4AF37',
        'gold-light': '#F5E6D3',
        maroon: '#8B1E3F',
        'text-dark': '#1A1A1A',
        'text-muted': '#6B6B6B',
        'text-light': '#9B9B9B',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'heart-burst': {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '50%': { transform: 'scale(1.2)', opacity: 1 },
          '100%': { transform: 'scale(1)', opacity: 0 },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      animation: {
        'fade-up': 'fade-up 600ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'fade-in': 'fade-in 400ms ease-out both',
        'heart-burst': 'heart-burst 700ms ease-out both',
        'slide-up': 'slide-up 400ms ease-out both',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0,0,0,0.04)',
        'card': '0 4px 16px rgba(0,0,0,0.08)',
        'md': '0 4px 16px rgba(0,0,0,0.08)',
        'lg': '0 8px 32px rgba(0,0,0,0.12)',
        'xl': '0 16px 48px rgba(0,0,0,0.16)',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    }
  },
  plugins: [],
}
