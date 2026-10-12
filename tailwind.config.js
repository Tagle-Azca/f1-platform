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
        display:   ['var(--pw-display)'],
        mono:      ['var(--pw-mono)'],
      },
      colors: {
        // Team accent — updates live via CSS variable when user selects a team/driver.
        // Supports all Tailwind opacity modifiers: bg-accent/10, border-accent/30, etc.
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',

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

        // ── Pitwall tokens (canonical --pw-*) ──
        bg:        'var(--pw-bg)',
        panel:     'var(--pw-panel)',
        raise:     'var(--pw-raise)',
        hover:     'var(--pw-hover)',
        sidebar:   'var(--pw-sidebar)',
        edge:      { DEFAULT: 'var(--pw-edge)', soft: 'var(--pw-edge-soft)' },
        ink:       { DEFAULT: 'var(--pw-ink)', 2: 'var(--pw-ink-2)', 3: 'var(--pw-ink-3)' },
        steel:     { DEFAULT: 'var(--pw-steel)', hi: 'var(--pw-steel-hi)', soft: 'var(--pw-steel-soft)' },
        pos:       'var(--pw-pos)',
        neg:       'var(--pw-neg)',
        live:      { DEFAULT: 'var(--pw-red)', soft: 'var(--pw-red-soft)' },
        violet:    'var(--pw-violet)',
        signal:    { yellow: 'var(--pw-yellow)', orange: 'var(--pw-orange)' },
      },
      fontSize: {
        '2xs':  ['var(--text-2xs)', { lineHeight: '1rem' }],
        'xs':   ['var(--text-xs)',  { lineHeight: '1rem' }],
        'sm':   ['var(--text-sm)',  { lineHeight: '1.25rem' }],
        'base': ['var(--text-base)',{ lineHeight: '1.5rem' }],
        'lg':   ['var(--text-lg)', { lineHeight: '1.625rem' }],
        'display': ['var(--text-display)', { lineHeight: '1' }],
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
        // 4px grid for touched files (legacy 1..8 keys untouched, see UIUX 2.3)
        'pw-1': '4px', 'pw-2': '8px', 'pw-3': '12px', 'pw-4': '16px',
        'pw-5': '20px', 'pw-6': '24px', 'pw-7': '32px', 'pw-8': '48px',
        'tabbar': 'var(--tabbar-height)',
        'header': 'var(--header-height)',
        'sidebar': 'var(--sidebar-width)',
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
