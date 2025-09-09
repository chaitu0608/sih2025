/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nb: {
          bg: '#fafafa',
          ink: '#0a0a0a',
          primary: '#1f6feb',
          accent: '#ffde03',
          danger: '#ef4444',
          success: '#22c55e'
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      borderWidth: {
        3: '3px',
        6: '6px'
      },
      boxShadow: {
        'nb': '8px 8px 0 0 rgba(0,0,0,1)',
        'nb-sm': '4px 4px 0 0 rgba(0,0,0,1)'
      },
      dropShadow: {
        'nb-text': '3px 3px 0 rgba(0,0,0,1)'
      },
      animation: {
        'pulse-danger': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}