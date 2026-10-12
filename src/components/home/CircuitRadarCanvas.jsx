import { useEffect, useRef } from 'react'
import { telemetryApi } from '../../services/api'
import { safeColor } from '../../utils/safeUrl'
import { readVizColors } from '../../styles/chartTheme'

const TRAIL_LEN  = 100   // positions to keep per driver
const MIN_BOUNDS = 500   // minimum circuit dimension in metres
const POLL_MS    = 1000

// Build color map from driver list
function buildColorMap(drivers) {
  const map = {}
  for (const d of (Array.isArray(drivers) ? drivers : [])) {
    if (!d || typeof d !== 'object') continue
    if (safeColor(d.teamColor)) map[d.driverNum] = d.teamColor
  }
  return map
}

/**
 * Track radar. Draws on demand (new positions, selection, resize, tab becoming visible) through a single
 * requestAnimationFrame, and never while the tab is hidden: there is no perpetual render loop.
 * Colors are read from the --pw-* / --viz-* CSS vars once at mount. No halo, no glow.
 */
export default function CircuitRadarCanvas({ drivers, selectedDriverNum }) {
  const canvasRef      = useRef(null)
  const latestRef      = useRef({})    // { driverNum: {x,y} }
  const historyRef     = useRef({})    // { driverNum: [{x,y},...] }
  const selectedRef    = useRef(selectedDriverNum)
  const colorMapRef    = useRef({})
  const drawRef        = useRef(null)  // schedules a frame (set by the render effect)

  // Keep refs in sync with props, and redraw when the selection or colors change
  useEffect(() => { selectedRef.current = selectedDriverNum; drawRef.current?.() }, [selectedDriverNum])
  useEffect(() => { colorMapRef.current = buildColorMap(drivers); drawRef.current?.() }, [drivers])

  // Poll car positions every second
  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const data = await telemetryApi.getCarPositions()
        if (cancelled || !data?.positions || typeof data.positions !== 'object' || Array.isArray(data.positions)) return
        const clean = {}
        for (const [num, pos] of Object.entries(data.positions)) {
          if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) clean[num] = pos
        }
        latestRef.current = clean
        for (const [num, pos] of Object.entries(clean)) {
          const trail = historyRef.current[num] ?? []
          trail.push(pos)
          if (trail.length > TRAIL_LEN) trail.shift()
          historyRef.current[num] = trail
        }
        drawRef.current?.()
      } catch { /* best-effort */ }
    }
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const palette = readVizColors()
    let raf = null

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const W   = canvas.offsetWidth  || 200
      const H   = canvas.offsetHeight || 200
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width  = W * dpr
        canvas.height = H * dpr
      }
      const ctx = canvas.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      ctx.fillStyle = palette.bg
      ctx.fillRect(0, 0, W, H)

      const latest  = latestRef.current
      const history = historyRef.current
      const colors  = colorMapRef.current
      const selNum  = selectedRef.current

      if (!Object.keys(latest).length) {
        drawWaiting(ctx, W, H, palette)
        return
      }

      // Bounds from history
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

      // Circuit trail
      ctx.lineWidth   = 5
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      ctx.strokeStyle = palette.track
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

      // Driver dots (non-selected first, selected on top). The selection is a static ring, not a pulse.
      const sorted = Object.entries(latest)
        .sort(([a], [b]) => (a === selNum ? 1 : 0) - (b === selNum ? 1 : 0))

      for (const [num, pos] of sorted) {
        const [px, py] = tc(pos.x, pos.y)
        const color    = colors[num] || palette.ink3
        const isSel    = num === selNum

        if (isSel) {
          ctx.beginPath()
          ctx.arc(px, py, 10, 0, Math.PI * 2)
          ctx.strokeStyle = palette.ink
          ctx.lineWidth   = 1.5
          ctx.stroke()
        }
        ctx.beginPath()
        ctx.arc(px, py, isSel ? 5.5 : 3.5, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.beginPath()
        ctx.arc(px, py, isSel ? 1.8 : 1.1, 0, Math.PI * 2)
        ctx.fillStyle = palette.bg
        ctx.fill()
      }
    }

    // One frame at a time, and none while the tab is hidden.
    const request = () => {
      if (raf !== null || document.visibilityState !== 'visible') return
      raf = requestAnimationFrame(() => { raf = null; draw() })
    }
    drawRef.current = request
    const onVisible = () => request()
    document.addEventListener('visibilitychange', onVisible)
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(request) : null
    ro?.observe(canvas)
    request()
    return () => {
      drawRef.current = null
      document.removeEventListener('visibilitychange', onVisible)
      ro?.disconnect()
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Track radar: live car positions. The timing table lists the same drivers."
      className="block w-full h-full"
    />
  )
}

function drawWaiting(ctx, W, H, palette) {
  ctx.beginPath()
  ctx.arc(W / 2, H / 2, 32, 0, Math.PI * 2)
  ctx.strokeStyle = palette.baseline
  ctx.lineWidth   = 1
  ctx.stroke()
  ctx.fillStyle   = palette.ink2
  ctx.font        = '500 12px Barlow, sans-serif'
  ctx.textAlign   = 'center'
  ctx.fillText('Waiting for', W / 2, H / 2 - 2)
  ctx.fillText('position data', W / 2, H / 2 + 13)
}
