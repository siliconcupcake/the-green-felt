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
        // Admin console — mirrors lobby palette, no gradients
        admin: {
          // Surfaces (terminal-dark base, subtle lifts for panels)
          bg: { DEFAULT: '#0a0a0a', surface: '#111111', elevated: '#161616' },
          // Text hierarchy (brighter for terminal contrast)
          text: { DEFAULT: '#f5f5f5', muted: '#aaaaaa', dim: '#777777', key: '#cccccc' },
          // Borders
          border: { DEFAULT: '#1e1e1e', subtle: '#181818' },
          // Inputs
          input: { bg: '#0e0e0e', border: '#2a2a2a' },
          // Single primary accent (lobby green)
          accent: '#34d399',
          // Label/section accent (warm muted — for headers only)
          label: '#d4a574',
          // Destructive (lobby red)
          red: '#ef4444',
          // Lifecycle events (neutral, not a distinct accent)
          muted: '#888888',
          // Semantic button backgrounds (green-tinted, matching lobby)
          'btn-primary': { DEFAULT: 'rgba(52,211,153,0.08)', hover: 'rgba(52,211,153,0.15)' },
          'btn-danger': { DEFAULT: 'rgba(239,68,68,0.08)', hover: 'rgba(239,68,68,0.15)' },
          'btn-success': { DEFAULT: 'rgba(52,211,153,0.08)', hover: 'rgba(52,211,153,0.15)' },
          'btn-neutral': { DEFAULT: 'rgba(255,255,255,0.04)', hover: 'rgba(255,255,255,0.08)' },
          // Semantic status backgrounds
          'status-success': 'rgba(52,211,153,0.06)',
          'status-error': 'rgba(239,68,68,0.08)',
          'status-warning': 'rgba(212,165,116,0.08)',
          'status-highlight': 'rgba(52,211,153,0.06)',
          // JSON syntax
          'json-string': '#34d399',
          'json-match': 'rgba(52,211,153,0.1)',
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
