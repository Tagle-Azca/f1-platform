/** Unboxed page section (`.section`): heading, one-line caption, optional right-side slot (legend/toggle). */
export default function TelemetrySection({ id, title, caption, aside, className = '', children }) {
  return (
    <section className={`section min-w-0 ${className}`} aria-labelledby={id}>
      <div className="mb-pw-4 flex flex-col gap-pw-2 md:flex-row md:items-end md:justify-between md:gap-pw-4">
        <div className="min-w-0">
          <h2 id={id} className="text-heading text-ink">{title}</h2>
          {caption && <p className="mt-pw-1 text-xs text-ink-3">{caption}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** Legend row: each item is a swatch + text, so color is never the only key. */
export function Legend({ items }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-pw-4 gap-y-pw-1">
      {items.map(it => (
        <li key={it.key} className="flex items-center gap-pw-2 text-xs text-ink-2">
          {it.swatch}
          {it.label}
        </li>
      ))}
    </ul>
  )
}

/** Line swatch for a series legend (solid or dashed). */
export function LineSwatch({ color, dashed = false }) {
  return (
    <svg aria-hidden="true" width="18" height="4" className="shrink-0">
      <line x1="0" y1="2" x2="18" y2="2" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '6 3' : undefined} />
    </svg>
  )
}

/** Square swatch for a bar series. */
export function BlockSwatch({ color }) {
  return (
    <svg aria-hidden="true" width="10" height="10" className="shrink-0">
      <rect width="10" height="10" rx="2" fill={color} />
    </svg>
  )
}
