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
        // Admin console — semantic surface tiers
        admin: {
          // Surfaces (3-tier elevation)
          bg: { DEFAULT: '#0f0f1a', surface: '#16162a', elevated: '#1e1e38' },
          // Text hierarchy
          text: { DEFAULT: '#e0e0e0', muted: '#888888', dim: '#555555', key: '#c0c0c0' },
          // Borders
          border: { DEFAULT: '#2a2a3e', subtle: '#222233' },
          // Inputs
          input: { bg: '#111118', border: '#3a3a4e' },
          // Accent colors
          blue: '#54a0ff',
          orange: '#ff9f43',
          green: '#10ac84',
          purple: '#5f27cd',
          red: '#ee5253',
          // Semantic button backgrounds
          'btn-primary': { DEFAULT: 'rgba(84,160,255,0.10)', hover: 'rgba(84,160,255,0.20)' },
          'btn-danger': { DEFAULT: 'rgba(238,82,83,0.10)', hover: 'rgba(238,82,83,0.20)' },
          'btn-success': { DEFAULT: 'rgba(16,172,132,0.10)', hover: 'rgba(16,172,132,0.20)' },
          'btn-neutral': { DEFAULT: 'rgba(255,255,255,0.05)', hover: 'rgba(255,255,255,0.10)' },
          // Semantic status backgrounds
          'status-success': 'rgba(16,172,132,0.08)',
          'status-error': 'rgba(238,82,83,0.08)',
          'status-warning': 'rgba(255,159,67,0.08)',
          'status-highlight': 'rgba(84,160,255,0.08)',
          // JSON syntax
          'json-string': '#6ab04c',
          'json-match': 'rgba(42,58,26,0.6)',
        },
      },
      borderRadius: {
        card: '0.625rem',
        button: '0.5rem',
        badge: '0.25rem',
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
