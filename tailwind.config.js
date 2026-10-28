/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#0d1117',
          deep: '#0a0d12',
          light: '#13171f',
        },
        panel: {
          DEFAULT: '#161b22',
          elevated: '#1f242c',
          card: '#181d24',
          subtle: '#21262d',
        },
        border: {
          DEFAULT: '#30363d',
          dark: '#21262d',
          subtle: '#3b434d',
        },
        primary: {
          DEFAULT: '#f0f3f6',
          muted: '#9da7b3',
          dim: '#656d76',
        },
        emergency: {
          DEFAULT: '#dc2626',
          light: '#ef4444',
          dark: '#b91c1c',
          bg: 'rgba(220, 38, 38, 0.12)',
        },
        hazard: {
          DEFAULT: '#d97706',
          light: '#f59e0b',
          dark: '#b45309',
          bg: 'rgba(217, 119, 6, 0.12)',
        },
        safe: {
          DEFAULT: '#059669',
          light: '#10b981',
          dark: '#047857',
          bg: 'rgba(5, 150, 105, 0.12)',
        },
        operational: {
          cyan: '#0284c7',
          purple: '#7c3aed',
          slate: '#475569',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
