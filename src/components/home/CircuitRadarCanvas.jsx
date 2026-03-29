import { useEffect, useRef } from 'react'
import { telemetryApi } from '../../services/api'

const TRAIL_LEN  = 100   // positions to keep per driver
const MIN_BOUNDS = 500   // minimum circuit dimension in metres
const POLL_MS    = 1000

// Build color map from driver list
function buildColorMap(drivers) {
  const map = {}
  for (const d of drivers) {
    if (d.teamColor) map[d.driverNum] = d.teamColor
  }
  return map
}

export default function CircuitRadarCanvas({ drivers, selectedDriverNum }) {
  const canvasRef      = useRef(null)
  const latestRef      = useRef({})    // { driverNum: {x,y} }
  const historyRef     = useRef({})    // { driverNum: [{x,y},...] }
  const selectedRef    = useRef(selectedDriverNum)
  const colorMapRef    = useRef({})
  const rafRef         = useRef(null)
  const startTsRef     = useRef(null)

  // Keep refs in sync with props (avoids RAF re-binding on prop changes)
  useEffect(() => { selectedRef.current = selectedDriverNum }, [selectedDriverNum])
  useEffect(() => { colorMapRef.current = buildColorMap(drivers) }, [drivers])

  // Poll car positions every second
  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const data = await telemetryApi.getCarPositions()
        if (cancelled || !data?.positions) return
        latestRef.current = data.positions
        for (const [num, pos] of Object.entries(data.positions)) {
          const trail = historyRef.current[num] ?? []
          trail.push(pos)
          if (trail.length > TRAIL_LEN) trail.shift()
          historyRef.current[num] = trail
        }
      } catch { /* best-effort */ }
    }
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  // Render loop — runs until component unmounts (autoDispose equivalent)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = (ts) => {
      if (!startTsRef.current) startTsRef.current = ts
      const halo = (Math.sin((ts - startTsRef.current) / 600) + 1) / 2  // 0→1 smooth

      const dpr = window.devicePixelRatio || 1
      const W   = canvas.offsetWidth  || 200
      const H   = canvas.offsetHeight || 200
      canvas.width  = W * dpr
      canvas.height = H * dpr
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)

      // Background
      ctx.fillStyle = '#050505'
      ctx.fillRect(0, 0, W, H)

      const latest  = latestRef.current
      const history = historyRef.current
      const colors  = colorMapRef.current
      const selNum  = selectedRef.current

      if (!Object.keys(latest).length) {
        _drawWaiting(ctx, W, H)
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      // ── Bounds from history ──────────────────────────────
      let minX = Infinity, maxX = -Infinity
      let minY = Infinity, maxY = -Infinity
      for (const trail of Object.values(history)) {
        for (const p of trail) {
          if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x
          if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y
        }
      }
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
      const hw = Math.max((maxX - minX) / 2, MIN_BOUNDS / 2)
      const hh = Math.max((maxY - minY) / 2, MIN_BOUNDS / 2)
      minX = cx - hw; maxX = cx + hw
      minY = cy - hh; maxY = cy + hh

      const pad = 24
      const scale = Math.min((W - pad * 2) / (maxX - minX), (H - pad * 2) / (maxY - minY))
      const ox = pad + ((W - pad * 2) - (maxX - minX) * scale) / 2
      const oy = pad + ((H - pad * 2) - (maxY - minY) * scale) / 2
      const tc = (x, y) => [ox + (x - minX) * scale, oy + (y - minY) * scale]

      // ── Circuit trail ────────────────────────────────────
      ctx.lineWidth   = 5
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'
      for (const trail of Object.values(history)) {
        if (trail.length < 2) continue
        ctx.beginPath()
        const [sx, sy] = tc(trail[0].x, trail[0].y)
        ctx.moveTo(sx, sy)
        for (let i = 1; i < trail.length; i++) {
          const [px, py] = tc(trail[i].x, trail[i].y)
          ctx.lineTo(px, py)
        }
        ctx.stroke()
      }

      // ── Driver dots (non-selected first, selected on top) ─
      const sorted = Object.entries(latest)
        .sort(([a], [b]) => (a === selNum ? 1 : 0) - (b === selNum ? 1 : 0))

      for (const [num, pos] of sorted) {
        const [px, py] = tc(pos.x, pos.y)
        const color    = colors[num] || '#777777'
        const isSel    = num === selNum
        const r        = isSel ? 5.5 : 3.5

        // Pulsing halo for selected driver
        if (isSel) {
          const hR = 10 + halo * 9
          ctx.beginPath()
          ctx.arc(px, py, hR, 0, Math.PI * 2)
          ctx.fillStyle = _rgba(color, 0.12 + halo * 0.18)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(px, py, hR, 0, Math.PI * 2)
          ctx.strokeStyle = _rgba(color, 0.55 + halo * 0.35)
          ctx.lineWidth   = 1.5
          ctx.stroke()
        }

        // Glow
        ctx.shadowColor = color
        ctx.shadowBlur  = isSel ? 10 : 5
        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.shadowBlur = 0

        // White centre
        ctx.beginPath()
        ctx.arc(px, py, isSel ? 1.8 : 1.1, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])  // empty deps — runs once, uses refs for all dynamic data

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function _drawWaiting(ctx, W, H) {
  ctx.beginPath()
  ctx.arc(W / 2, H / 2, 32, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(168,85,247,0.12)'
  ctx.lineWidth   = 1
  ctx.stroke()
  ctx.fillStyle   = 'rgba(255,255,255,0.18)'
  ctx.font        = '700 9px "Barlow Condensed", sans-serif'
  ctx.textAlign   = 'center'
  ctx.letterSpacing = '1px'
  ctx.fillText('WAITING', W / 2, H / 2 - 2)
  ctx.fillText('POSITION DATA', W / 2, H / 2 + 11)
}

/** Convert hex color + alpha to rgba string */
function _rgba(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`
}
