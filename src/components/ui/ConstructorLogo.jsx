import { useState, useEffect } from 'react'

const WIKI_SLUGS = {
  // Current 2026 grid
  red_bull:     'Red_Bull_Racing',
  ferrari:      'Scuderia_Ferrari',
  mercedes:     'Mercedes-AMG_Petronas_F1_Team',
  mclaren:      'McLaren',
  aston_martin: 'Aston_Martin_Aramco_F1_Team',
  alpine:       'Alpine_F1_Team',
  williams:     'Williams_Racing',
  rb:           'Racing_Bulls',
  racing_bulls: 'Racing_Bulls',
  kick_sauber:  'Stake_F1_Team_Kick_Sauber',
  sauber:       'Stake_F1_Team_Kick_Sauber',
  haas:         'Haas_F1_Team',
  // Historical
  renault:      'Renault_in_Formula_One',
  force_india:  'Force_India',
  racing_point: 'Racing_Point_F1_Team',
  toro_rosso:   'Scuderia_Toro_Rosso',
  alfa:         'Alfa_Romeo_in_Formula_One',
  lotus_f1:     'Lotus_F1_Team',
  brawn:        'Brawn_GP',
}

/**
 * Constructors whose Wikipedia thumbnail is predominantly dark/black.
 * These get inverted to white/silver so they're visible on dark backgrounds.
 * Colored logos (Ferrari red, McLaren orange, etc.) keep their colors.
 */
const DARK_LOGOS = new Set(['aston_martin', 'mercedes', 'haas', 'williams', 'rb', 'racing_bulls'])

function getFilter(constructorId) {
  if (DARK_LOGOS.has(constructorId)) {
    // Dark/black logo → invert to white/silver
    return 'invert(1) brightness(1.5)'
  }
  // Colored logo → preserve colors, boost saturation so it pops on dark bg
  return 'saturate(1.3) brightness(1.1)'
}

const cache = {}

function fetchLogo(constructorId) {
  const slug = WIKI_SLUGS[constructorId]
  if (!slug) return Promise.resolve(null)
  if (cache[constructorId] !== undefined) return Promise.resolve(cache[constructorId])

  return fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`)
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      const url = d?.thumbnail?.source ?? null
      cache[constructorId] = url
      return url
    })
    .catch(() => { cache[constructorId] = null; return null })
}

/**
 * ConstructorLogo
 *
 * Renders a constructor logo inside a consistent rounded box:
 *   • bg-white/5 + border-white/10 frame so dark logos have a reference point
 *   • Smart filter: dark logos → invert to white; colored logos → saturate
 *   • object-contain + uniform padding for consistent visual weight
 *   • Fallback to colored initials box when logo unavailable
 *
 * Props:
 *   constructorId   string   — Ergast constructorId (e.g. "aston_martin")
 *   name            string   — team display name (used for alt + fallback)
 *   color?          string   — team color for fallback box (default '#888')
 *   size?           number   — box size in px (default 40)
 *   radius?         number   — border-radius in px (default size * 0.18)
 *   style?          object   — extra styles on the outer container
 */
export default function ConstructorLogo({
  constructorId,
  name,
  color = '#888',
  size = 40,
  radius,
  style = {},
}) {
  const [url, setUrl] = useState(cache[constructorId] ?? undefined)

  useEffect(() => {
    if (!constructorId) return
    if (cache[constructorId] !== undefined) { setUrl(cache[constructorId]); return }
    fetchLogo(constructorId).then(setUrl)
  }, [constructorId])

  const r  = radius ?? Math.round(size * 0.18)
  const pad = Math.max(4, Math.round(size * 0.12))

  const boxStyle = {
    width: size, height: size,
    borderRadius: r,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: pad,
    overflow: 'hidden',
    flexShrink: 0,
    boxSizing: 'border-box',
    ...style,
  }

  // Still fetching → skeleton box
  if (url === undefined) {
    return <div style={{ ...boxStyle, background: 'rgba(255,255,255,0.03)' }} />
  }

  // Logo available
  if (url) {
    return (
      <div style={boxStyle}>
        <img
          src={url}
          alt={name ?? constructorId}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: getFilter(constructorId),
          }}
        />
      </div>
    )
  }

  // Fallback: colored initials box
  const initials = (name ?? constructorId ?? '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()

  return (
    <div style={{
      ...boxStyle,
      background: `${color}18`,
      border: `1px solid ${color}35`,
      fontFamily: "'Barlow Condensed', sans-serif",
      fontSize: Math.round(size * 0.3),
      fontWeight: 800,
      color,
      letterSpacing: '-0.02em',
    }}>
      {initials}
    </div>
  )
}
