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

  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    const len = path.getTotalLength()

    // Set initial state without transition (invisible)
    path.style.transition      = 'none'
    path.style.strokeDasharray = len
    path.style.strokeDashoffset = animate ? len : 0

    if (dotRef.current) {
      dotRef.current.style.transition = 'none'
      dotRef.current.style.opacity    = animate ? '0' : '1'
    }

    if (!animate) return

    // Wait one frame for the browser to paint the hidden state, then animate
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        path.style.transition       = 'stroke-dashoffset 5s linear'
        path.style.strokeDashoffset = '0'

        if (dotRef.current) {
          dotRef.current.style.transition = 'opacity 0.5s 4.8s'
          dotRef.current.style.opacity    = '1'
        }
      })
    })

    return () => cancelAnimationFrame(raf)
  // Re-run only when coords change (new circuit)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords])

  if (!coords?.length) return null

  const projected = projectCoords(coords, width, height)
  const d         = toPath(projected)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ overflow: 'visible', ...style }}
    >
      <defs>
        <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>
      </defs>

      {/* Glow layer — always fully visible, no animation needed */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth + 5}
        strokeOpacity={0.15}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${filterId})`}
      />

      {/* Main track line — animated via ref */}
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
        opacity={0.92}
      />

      {/* Start/finish dot */}
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

      {/* Moving car dot — starts after draw animation (5s), loops indefinitely */}
      {animate && (
        <>
          {/* Glow halo */}
          <circle r={6} fill={color} opacity={0} filter={`url(#${filterId})`}>
            <set attributeName="opacity" to="0.5" begin="5s" fill="freeze" />
            <animateMotion dur="8s" repeatCount="indefinite" begin="5s" calcMode="linear" rotate="auto">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
          {/* White core dot */}
          <circle r={2.8} fill="#ffffff" opacity={0}>
            <set attributeName="opacity" to="1" begin="5s" fill="freeze" />
            <animateMotion dur="8s" repeatCount="indefinite" begin="5s" calcMode="linear" rotate="auto">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
        </>
      )}
    </svg>
  )
}
