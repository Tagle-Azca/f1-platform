/**
 * Meter — horizontal or vertical fill bar. The fill size is the one dynamic value (inline).
 * tone: Tailwind bg class for the fill (e.g. 'bg-pos'). Decorative: pair it with a text value.
 */
export default function Meter({ value = 0, tone = 'bg-steel', vertical = false, className = '' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  const size = vertical ? { height: `${pct}%` } : { width: `${pct}%` }
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden rounded-sm bg-white/10 ${vertical ? 'flex flex-col justify-end w-1.5' : 'h-1 w-full'} ${className}`}
    >
      <div className={`${tone} ${vertical ? 'w-full' : 'h-full'} motion-safe:transition-all duration-200`} style={size} />
    </div>
  )
}
