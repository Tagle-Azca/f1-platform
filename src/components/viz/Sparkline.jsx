/**
 * Points-per-round bars (data SVG, decorative: pair it with a sentence for screen readers).
 * One bar per round on the scale [0, max(biggest value, floor)]. The marked round is full opacity with a 2px cap
 * line under it; rounds after it are dimmed; a zero round is a 1px stub. Geometry is SVG attributes only.
 */
export default function Sparkline({ values, mark, color, floor = 25, height = 48, className = 'w-full' }) {
  const list = Array.isArray(values) ? values.map(v => (Number.isFinite(v) && v > 0 ? v : 0)) : []
  const n = list.length
  if (!n) return null
  const max = Math.max(floor, ...list)
  const W = 10 // viewBox units per round (9 bar + 1 gap)
  const cap = 3
  const m = Number.isFinite(mark) ? Math.min(Math.max(1, Math.round(mark)), n) : n
  return (
    <svg
      aria-hidden="true" focusable="false" viewBox={`0 0 ${n * W} ${height + cap}`} preserveAspectRatio="none"
      width="100%" height={height + cap} className={`block ${className}`} data-sparkline
    >
      {list.map((v, i) => {
        const h = v > 0 ? Math.max(1, (v / max) * height) : 1
        return (
          <rect
            key={i} x={i * W} y={height - h} width={W - 1} height={h} rx="1"
            fill={v > 0 ? color : 'var(--viz-baseline)'} fillOpacity={i + 1 > m ? 0.3 : 1}
          />
        )
      })}
      <rect x={(m - 1) * W} y={height + 1} width={W - 1} height="2" fill="var(--pw-ink)" />
    </svg>
  )
}
