import { useState, useEffect } from 'react'
import CircuitSilhouette from '../circuit/CircuitSilhouette'
import { circuitsApi } from '../../services/api'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const LOADER_CIRCUIT_ID = 'monaco'

const DIMS = {
  sm: { w: 110, h: 70  },
  md: { w: 200, h: 130 },
  lg: { w: 280, h: 180 },
}

let coordsPromise = null

function fetchLoaderCoords() {
  if (!coordsPromise) {
    coordsPromise = circuitsApi.getById(LOADER_CIRCUIT_ID)
      .then(c => c?.trackCoords ?? null)
      .catch(() => null)
  }
  return coordsPromise
}

export default function CircuitLoader({ message = 'Loading...', size = 'md', height = 220, page = false }) {
  const [coords, setCoords] = useState(null)
  const { isMobile } = useBreakpoint()

  useEffect(() => {
    let cancelled = false
    fetchLoaderCoords().then(c => { if (!cancelled) setCoords(c) })
    return () => { cancelled = true }
  }, [])

  const dims = page && !isMobile ? { w: 520, h: 340 } : (DIMS[size] ?? DIMS.md)
  const minHeight = page && !isMobile ? 440 : height

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '0.75rem', minHeight,
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
        <div style={{ width: dims.w, height: dims.h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
