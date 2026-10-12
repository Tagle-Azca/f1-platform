import { cn } from '@/lib/utils'

const strong = (a, b) => (a > b ? 'font-semibold text-ink' : 'text-ink-2')

/**
 * Mirrored bar pair: the left side grows left, the right side (same hue at 50%) grows right, both scaled to `max`.
 * Decorative SVG (aria-hidden); the codes and the numbers under it carry the values, `caption` sits between them.
 * Shared by the Standings row detail and the driver profile so the two cannot drift.
 *
 * @param {{ code: string, value: number }} left
 * @param {{ code: string, value: number }} right
 * @param {string} color  resolved bar colour (callers pass `teamMark(hex, ground)`)
 * @param {number} max    full-scale value (at least 1)
 * @param {string} caption  text between the two numbers
 */
export default function HeadToHeadBar({ left, right, color, max, caption }) {
  const scale = Math.max(1, max)
  return (
    <>
      <div className="mt-pw-1 grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-x-pw-2">
        <span className="text-xs text-ink-2">{left.code}</span>
        <svg aria-hidden="true" viewBox="0 0 100 6" preserveAspectRatio="none" className="h-1.5 w-full">
          <rect width="100" height="6" rx="1" fill="var(--viz-track)" />
          <g transform="translate(100 0) scale(-1 1)"><rect height="6" rx="1" fill={color} width={(left.value / scale) * 100} /></g>
        </svg>
        <svg aria-hidden="true" viewBox="0 0 100 6" preserveAspectRatio="none" className="h-1.5 w-full">
          <rect width="100" height="6" rx="1" fill="var(--viz-track)" />
          <rect height="6" rx="1" fill={color} fillOpacity="0.5" width={(right.value / scale) * 100} />
        </svg>
        <span className="text-xs text-ink-2">{right.code}</span>
      </div>
      <p className="mt-pw-1 flex justify-between text-xs">
        <span className={cn('num', strong(left.value, right.value))}>{left.value}</span>
        <span className="text-ink-2">{caption}</span>
        <span className={cn('num', strong(right.value, left.value))}>{right.value}</span>
      </p>
    </>
  )
}
