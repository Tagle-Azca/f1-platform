import GapBar from '../viz/GapBar'
import { rankAt, surnameOf } from '../standings/standingsModel'
import { teamMark } from '../../styles/vizPalette'

/** P2 and P3 once the title is decided: points, a shared-scale bar and the gap between them. */
export default function SecondPlaceBattle({ series, championId, roundsLeft = 0 }) {
  const rounds = series[0]?.cumulative.length ?? 0
  const [p2, p3] = rankAt(series, rounds).filter(r => r.id !== championId)
  if (!p2 || !p3) return null
  const gap = p2.pts - p3.pts
  const sentence = gap > 0 ? `${surnameOf(p2.name)} leads ${surnameOf(p3.name)} by ${gap} ${gap === 1 ? 'point' : 'points'}.` : `${surnameOf(p2.name)} and ${surnameOf(p3.name)} are level on points.`
  return (
    <div data-battle-p2 className="mt-pw-4 border-t border-edge-soft pt-pw-3">
      <h3 className="text-xs text-ink-3">Battle for P2{roundsLeft > 0 ? `, ${roundsLeft} ${roundsLeft === 1 ? 'round' : 'rounds'} left` : ''}</h3>
      <p className="mt-pw-1 text-sm text-ink-2">{sentence}</p>
      <ul aria-label="Second and third place" className="mt-pw-2 flex list-none flex-col gap-pw-2 p-0">
        {[p2, p3].map((r, i) => (
          <li key={r.id} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-pw-2">
            <span className="text-xs text-ink-3">P{i + 2}</span>
            <span className="flex min-w-0 flex-col gap-pw-1">
              <span className="truncate text-sm text-ink">{r.name}</span>
              <GapBar value={r.pts} max={Math.max(1, p2.pts)} mode="share" color={teamMark(r.color)} index={i} />
            </span>
            <span className="num text-ink">{r.pts}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
