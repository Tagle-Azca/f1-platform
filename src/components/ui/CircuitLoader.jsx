import { useState, useEffect } from 'react'
import CircuitSilhouette from '../circuit/CircuitSilhouette'
import { circuitsApi } from '../../services/api'

// Module-level cache — fetched once on first render, reused forever.
// Avoids re-fetching on every loading state across the app.
let _cachedCoords = null
let _fetchPromise = null

function getMonzaCoords() {
  if (_cachedCoords) return Promise.resolve(_cachedCoords)
  if (!_fetchPromise) {
    _fetchPromise = circuitsApi.getById('spa')
      .then(c => { _cachedCoords = c?.trackCoords ?? null; return _cachedCoords })
      .catch(() => null)
  }
  return _fetchPromise
}

export default function CircuitLoader({ message = 'Loading...', size = 'md', height = 220 }) {
  const [coords, setCoords] = useState(_cachedCoords) // instant if already cached

  useEffect(() => {
    if (_cachedCoords) return  // already have it
    getMonzaCoords().then(setCoords)
  }, [])

  const dims = {
    sm: { w: 110, h: 70  },
    md: { w: 200, h: 130 },
    lg: { w: 280, h: 180 },
  }[size] || { w: 200, h: 130 }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '0.75rem', minHeight: height,
    }}>
      {coords?.length ? (
        <CircuitSilhouette
          coords={coords}
          color="var(--f1-red)"
          width={dims.w}
          height={dims.h}
          strokeWidth={2}
          animate
        />
      ) : (
        // Fallback while circuit data loads (only on the very first render ever)
        <div style={{
          width: dims.w, height: dims.h,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--f1-red)',
            animation: 'pulse-dot 1.2s ease-in-out infinite',
          }} />
        </div>
      )}
      {message && (
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '0.72rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--text-muted)',
          animation: 'pulse-dot 1.8s ease-in-out infinite',
        }}>
          {message}
        </span>
      )}
    </div>
  )
}
