import { teamMark, BASE } from '../../styles/vizPalette'

const BOX = 'min-w-40 rounded-md border border-edge bg-raise px-pw-3 py-pw-2 shadow-lg'

/**
 * Chart tooltip (recharts passes `active` and the x `label`; the rows come from the model, not the payload).
 * Rows: only the highlighted entries, best first, the hovered entry first.
 */
export default function StandingsTooltip({ active, label, title, rowsAt, mode, hoverId }) {
  if (!active || label == null) return null
  const rows = rowsAt(label)
  if (!rows.length) return null
  const ordered = hoverId ? [...rows.filter(r => r.id === hoverId), ...rows.filter(r => r.id !== hoverId)] : rows
  return (
    <div className={BOX}>
      <p className="mb-pw-1 text-xs font-semibold text-ink">{title(label)}</p>
      <ul className="flex flex-col gap-pw-1">
        {ordered.map(r => (
          <li key={r.id} className="flex items-center gap-pw-2">
            <svg aria-hidden="true" width="8" height="8" className="shrink-0"><circle cx="4" cy="4" r="4" fill={teamMark(r.color, BASE.raise)} /></svg>
            <span className="w-10 text-xs text-ink-2">{r.code}</span>
            <span className="num text-ink">{mode === 'position' ? `P${r.pos}, ${r.pts} pts` : `${r.pts} pts`}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
