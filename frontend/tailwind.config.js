/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        'forge-bg':      '#0f1117',
        'forge-surface': '#141820',
        'forge-line':    '#1e2d42',
        'forge-blue':    '#2E75B6',
        'forge-blue-lt': '#4a9fd4',
        'forge-text':    '#e8edf5',
        'forge-dim':     '#6b7a8d',
        'forge-cyan':    '#00b4d8',
        'forge-green':   '#22c55e',
        'forge-red':     '#ef4444',
        'forge-amber':   '#f59e0b',
        'forge-ai-bg':   '#0d1f2d',
        'forge-usr-bg':  '#111e2e',
      },
      animation: {
        'fade-up':    'fadeUp 0.25s ease-out forwards',
        'slide-up':   'slideUp 0.2s ease-out forwards',
        'spin-slow':  'spin 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
