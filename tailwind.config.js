import { fontFamily } from 'tailwindcss/defaultTheme'

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:      ['Barlow', ...fontFamily.sans],
        condensed: ['Barlow Condensed', ...fontFamily.sans],
      },
      colors: {
        f1: {
          red:  '#e10600',
          dark: '#a00400',
        },
        dgraph:    '#ef4444',
        mongo:     '#22c55e',
        cassandra: '#a855f7',
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        border:    'var(--border-color)',
        background:'var(--bg-base)',
      },
      fontSize: {
        '2xs':  ['var(--text-2xs)', { lineHeight: '1rem' }],
        'xs':   ['var(--text-xs)',  { lineHeight: '1rem' }],
        'sm':   ['var(--text-sm)',  { lineHeight: '1.25rem' }],
        'base': ['var(--text-base)',{ lineHeight: '1.5rem' }],
        'lg':   ['var(--text-lg)', { lineHeight: '1.5rem' }],
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '7': 'var(--space-7)',
        '8': 'var(--space-8)',
      },
      borderRadius: {
        lg:   'var(--radius-lg)',
        md:   'var(--radius-md)',
        sm:   'var(--radius-sm)',
        xs:   'var(--radius-xs)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        card:    'var(--shadow-card)',
        float:   'var(--shadow-float)',
        'glow-red': 'var(--shadow-glow-red)',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(225,6,0,0)' },
          '50%':      { boxShadow: '0 0 16px 4px rgba(225,6,0,0.25)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%':      { opacity: 0.4, transform: 'scale(0.75)' },
        },
        'slide-in': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'draw-path': {
          from: { strokeDashoffset: '1' },
          to:   { strokeDashoffset: '0' },
        },
      },
      animation: {
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'slide-in':  'slide-in 0.25s ease forwards',
      },
    },
  },
  plugins: [],
}
