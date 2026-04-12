import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: [
          'SF Mono',
          'Monaco',
          'Inconsolata',
          'Fira Mono',
          'Droid Sans Mono',
          'Source Code Pro',
          'monospace',
        ],
      },
      colors: {
        // Dark theme surfaces
        base: '#121212',
        surface: '#1a1a1a',
        elevated: '#1e1e1e',
        // Borders
        border: { DEFAULT: '#2a2a2a', subtle: '#222222' },
        // Text
        'text-primary': '#f5f5f5',
        'text-secondary': '#888888',
        'text-muted': '#555555',
        'text-disabled': '#444444',
        // Green accent
        accent: {
          green: {
            DEFAULT: '#34d399',
            dark: '#059669',
            bg: 'rgba(52,211,153,0.06)',
            border: 'rgba(52,211,153,0.15)',
          },
          red: { DEFAULT: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
        },
        // Game table
        felt: { DEFAULT: '#35654d', dark: '#1a3a2a', light: '#4a8b6a' },
        gold: '#ffd700',
        teammate: '#64b5f6',
        myturn: '#4caf50',
        // Admin console
        admin: {
          bg: '#1a1a2e',
          blue: '#54a0ff',
          orange: '#ff9f43',
          green: '#10ac84',
          purple: '#5f27cd',
          red: '#ee5253',
        },
      },
      borderRadius: {
        card: '10px',
        button: '8px',
        badge: '4px',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shake: 'shake 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
