import { useEffect, useRef, useId } from 'react'

function projectCoords(coords, width, height, padding = 12) {
  const lons = coords.map(c => c[0])
  const lats = coords.map(c => c[1])
  const minLon = Math.min(...lons), maxLon = Math.max(...lons)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const lonRange = maxLon - minLon || 1
  const latRange = maxLat - minLat || 1

  const usableW = width  - padding * 2
  const usableH = height - padding * 2
  const scale   = Math.min(usableW / lonRange, usableH / latRange)

  const offX = padding + (usableW - lonRange * scale) / 2
  const offY = padding + (usableH - latRange * scale) / 2

  return coords.map(([lon, lat]) => [
    offX + (lon - minLon) * scale,
    offY + (maxLat - lat) * scale,   // flip Y
  ])
}

function toPath(pts) {
  if (!pts.length) return ''
  return pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`)
    .join(' ')
}

export default function CircuitSilhouette({
  coords,
  color       = '#e10600',
  width       = 220,
  height      = 160,
  strokeWidth = 2.5,
  animate     = true,
  className   = '',
  style       = {},
}) {
  const pathRef = useRef(null)
  const dotRef  = useRef(null)
  const uid     = useId().replace(/:/g, '-')
  const pathId  = `cst-path-${uid}`
  const filterId = `cst-glow-${uid}`
  const trailId  = `cst-trail-${uid}`

  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    const len = path.getTotalLength()

    path.style.transition       = 'none'
    path.style.strokeDasharray  = len
    path.style.strokeDashoffset = animate ? len : 0

    if (dotRef.current) {
      dotRef.current.style.transition = 'none'
      dotRef.current.style.opacity    = animate ? '0' : '1'
    }

    if (!animate) return

    // Double-rAF to force browser to paint initial hidden state before animating
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        path.style.transition       = 'stroke-dashoffset 2.8s cubic-bezier(0.4, 0, 0.2, 1)'
        path.style.strokeDashoffset = '0'

        if (dotRef.current) {
          dotRef.current.style.transition = 'opacity 0.4s 2.6s'
          dotRef.current.style.opacity    = '1'
        }
      })
    })

    return () => cancelAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords])

  if (!coords?.length) return null

  const projected = projectCoords(coords, width, height)
  const d         = toPath(projected)

  // Animation timing
  const drawDone = '2.8s'
  const lapDur   = '4.5s'

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ overflow: 'visible', ...style }}
    >
      <defs>
        {/* Soft glow for track and car */}
        <filter id={filterId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" />
        </filter>
        {/* Stronger glow for car core */}
        <filter id={trailId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
        </filter>
      </defs>

      {/* Track glow (background halo, always visible) */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth + 6}
        strokeOpacity={0.10}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${filterId})`}
      />

      {/* Main track line — dash-reveal animation */}
      <path
        ref={pathRef}
        id={pathId}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={99999}
        strokeDashoffset={99999}
        opacity={0.85}
      />

      {/* Start/finish dot — appears after track finishes drawing */}
      {projected[0] && (
        <circle
          ref={dotRef}
          cx={projected[0][0]}
          cy={projected[0][1]}
          r={3.5}
          fill={color}
          opacity={0}
        />
      )}

      {/* Car animation — starts after track draw finishes */}
      {animate && (
        <>
          {/* Outer glow halo (wide, soft) */}
          <circle r={8} fill={color} opacity={0} filter={`url(#${trailId})`}>
            <set attributeName="opacity" to="0.55" begin={drawDone} fill="freeze" />
            <animateMotion dur={lapDur} repeatCount="indefinite" begin={drawDone} calcMode="linear" rotate="auto">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>

          {/* Trail dot 2 (slightly behind, faded) */}
          <circle r={2} fill={color} opacity={0} filter={`url(#${filterId})`}>
            <set attributeName="opacity" to="0.35" begin={drawDone} fill="freeze" />
            <animateMotion dur={lapDur} repeatCount="indefinite" begin={`calc(${drawDone} + 0.22s)`} calcMode="linear" rotate="auto">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>

          {/* Trail dot 1 (close behind, brighter) */}
          <circle r={2.5} fill={color} opacity={0} filter={`url(#${filterId})`}>
            <set attributeName="opacity" to="0.55" begin={drawDone} fill="freeze" />
            <animateMotion dur={lapDur} repeatCount="indefinite" begin={`calc(${drawDone} + 0.12s)`} calcMode="linear" rotate="auto">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>

          {/* Car core (white dot) */}
          <circle r={3} fill="#ffffff" opacity={0}>
            <set attributeName="opacity" to="1" begin={drawDone} fill="freeze" />
            <animateMotion dur={lapDur} repeatCount="indefinite" begin={drawDone} calcMode="linear" rotate="auto">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
        </>
      )}
    </svg>
  )
}
