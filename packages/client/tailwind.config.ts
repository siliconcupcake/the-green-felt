import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: [
          'Geist Mono',
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
        base: '#0a0d0b',
        surface: '#141816',
        elevated: '#1b201c',
        // Borders — tinted to match green accent hue
        border: { DEFAULT: '#252b27', subtle: '#1e2420' },
        // Text
        'text-primary': '#eef1ef',
        'text-secondary': '#7d8a80',
        'text-muted': '#4d5950',
        'text-disabled': '#3a4240',
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
      boxShadow: {
        'card-hover': '0 0.5rem 2rem -0.25rem rgba(52,211,153,0.08), 0 0.25rem 0.5rem -0.125rem rgba(0,0,0,0.3)',
        'card-active': '0 0.125rem 0.5rem rgba(0,0,0,0.4)',
        glow: '0 0 1.25rem rgba(52,211,153,0.25)',
        'glow-lg': '0 0 2rem rgba(52,211,153,0.35)',
      },
      borderRadius: {
        card: '0.875rem',
        button: '0.5625rem',
        badge: '0.3125rem',
      },
      transitionTimingFunction: {
        snappy: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(0.5rem)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shake: 'shake 0.3s ease-in-out',
        'fade-in-up': 'fade-in-up 0.35s cubic-bezier(0.23, 1, 0.32, 1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
