/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#04080f',
          900: '#070e1a',
          850: '#0a1220',
          800: '#0d1526',
          750: '#101a2e',
          700: '#131f36',
          600: '#182641',
          500: '#1d2e4d',
          400: '#243659',
        },
        brand: {
          blue: '#3b82f6',
          indigo: '#6366f1',
          purple: '#8b5cf6',
          green: '#10b981',
          teal: '#14b8a6',
          cyan: '#06b6d4',
          yellow: '#f59e0b',
          orange: '#f97316',
          red: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'card-glow': 'radial-gradient(circle at top left, rgba(59,130,246,0.08) 0%, transparent 60%)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59,130,246,0.15)',
        'glow-green': '0 0 20px rgba(16,185,129,0.15)',
        'glow-purple': '0 0 20px rgba(139,92,246,0.15)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
      },
      animation: {
        'ticker': 'ticker 40s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}
